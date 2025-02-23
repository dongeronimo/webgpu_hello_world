import { mat4, quat, vec3 } from "gl-matrix";
import { createMesh, Mesh } from "../engine/mesh";
import { StandardPipeline } from "../engine/pipeline/standardPipeline";     
import { makeDepthTextureForRenderAttachment } from "../engine/textures";
import { createCanvas, getWebGPUContext, initWebGPU } from "../engine/webgpu";
import { loadShader } from "../io/shaderLoad";
import { Deg2Rad } from "./math";

let device: GPUDevice;
let canvas: HTMLCanvasElement;
let ctx: GPUCanvasContext;
let format: GPUTextureFormat;
let cubeMesh: Mesh;
let depthTexture: GPUTexture;
let projectionMatrix: mat4;

async function initializeGraphics() {
    const _device = await initWebGPU();
    const _canvas = createCanvas();
    const {context, canvasFormat} = await getWebGPUContext(_canvas, _device); 
    device = _device;
    ctx = context;
    canvas = _canvas;
    format = canvasFormat;
}

class Transform {
    private pos:vec3 = vec3.create();
    private scale:vec3 = [1.0, 1.0, 1.0];
    private rotation:quat = quat.create();
    private localTransform:mat4 = mat4.create();
    public GetLocalTransform():mat4 {return this.localTransform;}
    constructor(){
        this.calculateLocalTransform();
    }
    private calculateLocalTransform():mat4 {
        // Reset to identity
        mat4.identity(this.localTransform);
        
        // First translate to position in world
        mat4.translate(this.localTransform, this.localTransform, this.pos);
        
        // Then apply rotation at that position
        const rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, this.rotation);
        mat4.multiply(this.localTransform, this.localTransform, rotationMatrix);
        
        // Finally scale
        mat4.scale(this.localTransform, this.localTransform, this.scale);

        return this.localTransform;
    }
    public rotationFromAngleAxis(angleInRad:number, axis:vec3){
        quat.setAxisAngle(this.rotation, axis, angleInRad);
        this.calculateLocalTransform();
    }
    public setPosition(p:vec3){
        this.pos[0] = p[0];
        this.pos[1] = p[1];
        this.pos[2] = p[2];
        this.calculateLocalTransform();
    }
}
export async function main(){
    //inits canvas, device, context and format
    await initializeGraphics();
    cubeMesh = await createMesh(device, "meshes/monkey.glb");
    const standardPipeline = new StandardPipeline(device, cubeMesh.vertexBufferLayout, 100);
    await standardPipeline.initialize();
    depthTexture = makeDepthTextureForRenderAttachment(device, canvas.width, canvas.height);
    projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.perspective( projectionMatrix, Deg2Rad(45.0),canvas.width / canvas.height,0.1,100.0);
    // Set up camera position and orientation
    const eye = vec3.fromValues(15, 0, 15);
    const center = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);
    mat4.lookAt(viewMatrix, eye, center, up);
    // Animation variables
    let lastTime = 0;
    //create some transforms
    let transforms = new Array<Transform>();
    for(let i=0; i<10; i++){
        const x = i % 5;
        const y = i / 5;
        const pos:vec3 = [x*3-5, y*3-5, 0];
        const transform = new Transform();
        transform.setPosition(pos);
        transform.rotationFromAngleAxis(Deg2Rad(45.0), [1.0, 0,0]);
        transforms.push(transform);
    }
    function frame(currentTime: number) {
        const deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;

        standardPipeline.updateViewProjection(viewMatrix, projectionMatrix);
        // Update all transforms
        transforms.forEach((transform, index) => {
            transform.rotationFromAngleAxis(Deg2Rad(lastTime/20), [1.0, 0,0]);
            standardPipeline.updateModelMatrix(index, transform.GetLocalTransform());
        });

        // Begin encoding commands
        const commandEncoder = device.createCommandEncoder();
        // Get the current texture view from the context
        const textureView = ctx.getCurrentTexture().createView();
        // Start a render pass
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });
        // Set the pipeline and vertex/index buffers
        renderPass.setPipeline(standardPipeline.getPipeline());
        renderPass.setVertexBuffer(0, cubeMesh.vertexBuffer);
        renderPass.setIndexBuffer(cubeMesh.indexBuffer, 'uint16');
        // Draw each instance
        transforms.forEach((_, index) => {
            const dynamicOffset = index * standardPipeline.getDynamicOffsetSize();
            renderPass.setBindGroup(0, standardPipeline.getBindGroup('transform'), [dynamicOffset]);
            renderPass.drawIndexed(cubeMesh.indexCount);
        });
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
        
        // Schedule next frame
        requestAnimationFrame(frame);
    }
    // Schedule next frame
    requestAnimationFrame(frame);
}

export function changeResolution(w:number, h:number)
{
    // Update both the canvas dimensions and style
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    
    // Recreate the depth texture with the new dimensions immediately
    if (depthTexture) {
        depthTexture.destroy();
        depthTexture = makeDepthTextureForRenderAttachment(device, w, h);
    }
    
    // Update projection matrix with new aspect ratio
    mat4.perspective(
        projectionMatrix,
        Deg2Rad(45.0),
        w / h,
        0.1,
        100.0
    );
}