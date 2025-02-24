import { mat4, quat, vec3 } from "gl-matrix";
import { createMesh, Mesh } from "../engine/mesh";
import { StandardPipeline } from "../engine/pipeline/standardPipeline";     
import { makeDepthTextureForRenderAttachment } from "../engine/textures";
import { createCanvas, getWebGPUContext, initWebGPU } from "../engine/webgpu";
import { loadShader } from "../io/shaderLoad";
import { Deg2Rad } from "./math";
import { Behaviour, GameObject, MeshComponent, Transform } from "../engine/gameObject";
import { RotateBehaviour } from "../engine/behaviours/RotateBehaviour";
import { array } from "three/tsl";

let device: GPUDevice;
let canvas: HTMLCanvasElement;
let ctx: GPUCanvasContext;
let format: GPUTextureFormat;
let monkeyMesh: Mesh;
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

export async function main(){
    //inits canvas, device, context and format
    await initializeGraphics();
    monkeyMesh = await createMesh(device, "meshes/monkey.glb");
    const standardPipeline = new StandardPipeline(device, monkeyMesh.vertexBufferLayout, 100);
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
    //create the world
    let gameObjects = new Array<GameObject>();
    const root: GameObject = new GameObject("root");
    new Transform(root);
    new RotateBehaviour(root);
    gameObjects.push(root);
    for(let i=0;i<10; i++){
        const newGameObject = new GameObject(`monkey ${i}`);
        newGameObject.setParent(root);
        const transform = new Transform(newGameObject);
        const x = i % 5;
        const y = i / 5;
        const pos:vec3 = [x*3-5, y*3-5, 0];
        transform.setPosition(pos);
        transform.rotationFromAngleAxis(Deg2Rad(45.0), [1.0, 0,0]);
        if(i%2==0){
            new RotateBehaviour(newGameObject);
        }
        gameObjects.push(newGameObject);
    }
    let lastTime = 0;
    const behavioursTable = new Array<string>();
    behavioursTable.push(RotateBehaviour.name);
    function frame(currentTime: number) {
        const deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;
        //start behaviours that hasn't been started yet
        const behaviours = gameObjects.map((go)=>behavioursTable.map(b=>go.getComponent(b)! as Behaviour))
            .flatMap(bLst=> bLst.map(b=>b))
            .filter(go=>go!=null || go!=undefined);
        behaviours.filter(b=>!b.IsStarted()).forEach(b=>b.start());    
        //update behaviours
        behaviours.forEach(b=>b.update(deltaTime));
        //update view and projection uniforms in the gpu
        standardPipeline.updateViewProjection(viewMatrix, projectionMatrix);
        //update all model uniforms in the gpu
        const transforms = gameObjects.map( (go)=>{
            const transform = go.getComponent(Transform.name)! as Transform;
            return transform;
        });
        transforms.forEach( (t,i)=>{
            standardPipeline.updateModelMatrix(i, t.getWorldTransform());
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
        renderPass.setVertexBuffer(0, monkeyMesh.vertexBuffer);
        renderPass.setIndexBuffer(monkeyMesh.indexBuffer, 'uint16');
        // Draw each instance
        transforms.forEach((_, index) => {
            const dynamicOffset = index * standardPipeline.getDynamicOffsetSize();
            renderPass.setBindGroup(0, standardPipeline.getBindGroup('transform'), [dynamicOffset]);
            renderPass.drawIndexed(monkeyMesh.indexCount);
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