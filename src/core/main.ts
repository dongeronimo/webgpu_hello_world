import { mat4, quat, vec3 } from "gl-matrix";
import { createMesh, Mesh } from "../engine/mesh";
import { StandardPipeline } from "../engine/pipeline/standardPipeline";     
import { makeDepthTextureForRenderAttachment } from "../engine/textures";
import { createCanvas, getWebGPUContext, initWebGPU } from "../engine/webgpu";
import { loadShader } from "../io/shaderLoad";
import { Deg2Rad } from "./math";
import { Behaviour, GameObject, MeshComponent, Transform } from "../engine/gameObject";
import { RotateBehaviour } from "../engine/behaviours/RotateBehaviour";
import { PickerPipeline } from "../engine/pipeline/pickerPipeline";
import { GpuPickerRenderPass } from "../engine/renderPasses/GpuPickerRenderPass";


let device: GPUDevice;
let canvas: HTMLCanvasElement;
let ctx: GPUCanvasContext;
let format: GPUTextureFormat;
let monkeyMesh: Mesh;
let depthTexture: GPUTexture;
let projectionMatrix: mat4;
let gpuPicker: GpuPickerRenderPass;
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
    const pickerPipeline = new PickerPipeline(device, "rgba8unorm", 100);
    await pickerPipeline.initialize();

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
    //new RotateBehaviour(root);
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
        new MeshComponent(newGameObject, monkeyMesh);
        gameObjects.push(newGameObject);
    }
    let lastTime = 0;
    const behavioursTable = new Array<string>();
    behavioursTable.push(RotateBehaviour.name);

    //////canvas mouse event listeners//////
    const mouse = {
        x:-1, 
        y:-1,
        type: "",
        button: -1
    };
    canvas.addEventListener("click", (ev)=>{
        mouse.x = ev.x;
        mouse.y = ev.y;
        mouse.type = "click";
        mouse.button = ev.button;
        gpuPicker.setPendingPickRequest();
    });

    gpuPicker = new GpuPickerRenderPass(device, "rgba8unorm", canvas.width, canvas.height);
    function frame(currentTime: number) {
        /////////////handle time: calculate delta time./////////////
        const deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;
        /////////////start behaviours that hasn't been started yet///////////
        const behaviours = gameObjects.map((go)=>behavioursTable.map(b=>go.getComponent(b)! as Behaviour))
            .flatMap(bLst=> bLst.map(b=>b))
            .filter(go=>go!=null || go!=undefined);
        behaviours.filter(b=>!b.IsStarted()).forEach(b=>b.start());    
        /////////////update behaviours////////////////////////////////
        behaviours.forEach(b=>b.update(deltaTime));
        /////////////pass the uniforms to standardPipeline buffers/////////////
        //update view and projection uniforms in the gpu
        standardPipeline.updateViewProjection(viewMatrix, projectionMatrix);
        pickerPipeline.updateViewProjection(viewMatrix, projectionMatrix);
        //update all model uniforms in the gpu
        const transforms = gameObjects.map( (go)=>{
            const transform = go.getComponent(Transform.name)! as Transform;
            return transform;
        });
        transforms.forEach( (t,i)=>{
            const worldTransform = t.getWorldTransform();
            standardPipeline.updateModelMatrix(i, worldTransform);
            pickerPipeline.updateObjectSpecificUniformBuffer(i, worldTransform, t.owner.id);
        });
        /////////////Begin encoding commands//////////////
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.label ="mainCommandEncoder";
        // Get the current texture view from the context
        const textureView = ctx.getCurrentTexture().createView();
        // Start the main render passs
        const mainRenderPassEncoder = commandEncoder.beginRenderPass({
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
        mainRenderPassEncoder.setPipeline(standardPipeline.getPipeline());
        // Draw each mesh
        transforms.map( (t,i)=>{
            const dynamicOffset : number= i * standardPipeline.getDynamicOffsetSize();
            const mesh = t.owner.getComponent(MeshComponent.name) as MeshComponent;
            return {offset:dynamicOffset, mesh:mesh};
        }).filter( x => x.mesh != null && x.mesh != undefined)
        .forEach(x=>{
            mainRenderPassEncoder.setBindGroup(0, standardPipeline.getBindGroup('transform'), [x.offset]);
            mainRenderPassEncoder.setVertexBuffer(0, x.mesh.mesh.vertexBuffer);
            mainRenderPassEncoder.setIndexBuffer(x.mesh.mesh.indexBuffer, 'uint16');    
            mainRenderPassEncoder.drawIndexed(x.mesh.mesh.indexCount);
        });
        mainRenderPassEncoder.end();///end the main render pass
        device.queue.submit([commandEncoder.finish()]);

        // Handle picking if requested and not already in progress
        if (gpuPicker.shouldRunPicking()) {
            gpuPicker.beginPick(device, pickerPipeline, mouse.x, mouse.y);
            //render the scene to do picking
            transforms.map( (t,i)=>{
                const dynamicOffset : number= i * pickerPipeline.getDynamicOffsetSize();
                const mesh = t.owner.getComponent(MeshComponent.name) as MeshComponent;
                return {offset:dynamicOffset, mesh:mesh};
            }).filter( x => x.mesh != null && x.mesh != undefined)
            .forEach(x=>{
                gpuPicker.drawForPicking(x.offset, x.mesh.mesh);
            });
            gpuPicker.endPick(device);
            gpuPicker.readPickedObjectId().then((value:number)=>{
                console.log(`Object id: ${value}`)
                gpuPicker.pickOperationFinished();
            });
        }        
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
    gpuPicker.destroy();
    gpuPicker = new GpuPickerRenderPass(device,"rgba8unorm", w, h );
}