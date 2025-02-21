import { mat4, vec3 } from "gl-matrix";
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
    cubeMesh = await createMesh(device, "meshes/monkey.glb");
    const standardPipeline = new StandardPipeline(device, cubeMesh.vertexBufferLayout, 100);
    await standardPipeline.initialize();
    let depthTexture = makeDepthTextureForRenderAttachment(device, canvas.width, canvas.height);
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();
    mat4.perspective( projectionMatrix, Deg2Rad(45.0),canvas.width / canvas.height,0.1,100.0);
    // Set up camera position and orientation
    const eye = vec3.fromValues(0, 1.5, 5);
    const center = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);
    mat4.lookAt(viewMatrix, eye, center, up);
    // Animation variables
    let rotation = 0;
    let lastTime = 0;
    function frame(currentTime: number) {
        const deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;
        // Handle canvas resize if needed
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // Recreate depth texture when canvas is resized
            depthTexture.destroy();
            depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });

            // Update projection matrix with new aspect ratio
            mat4.perspective(
                projectionMatrix,
                Math.PI / 4,
                canvas.width / canvas.height,
                0.1,
                100.0
            );
        }
        // Update rotation for animation
        rotation += deltaTime * Deg2Rad(1);       
        // Create model matrix with rotation
        mat4.identity(modelMatrix);
        mat4.rotateY(modelMatrix, modelMatrix, rotation); 
        // Update MVP data in the pipeline
        standardPipeline.updateObjectMvp(
            0, 
            modelMatrix as Float32Array, 
            viewMatrix as Float32Array, 
            projectionMatrix as Float32Array
        );
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
        // Set the bind group with dynamic offset for this object
        renderPass.setBindGroup(0, standardPipeline.getBindGroup('mvp'), [0]); // Use offset 0 for our single object
        // Draw the mesh
        renderPass.drawIndexed(cubeMesh.indexCount);
        // End the render pass and submit the command buffer
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
        
        // Schedule next frame
        requestAnimationFrame(frame);
    }
    // Schedule next frame
    requestAnimationFrame(frame);
}