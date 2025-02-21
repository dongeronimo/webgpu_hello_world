import { createMesh } from "../engine/mesh";
import { createCanvas, getWebGPUContext, initWebGPU } from "../engine/webgpu";
import { loadShader } from "../io/shaderLoad";

async function initializeGraphics() {
    const device = await initWebGPU();
    const canvas = createCanvas();
    const {context, canvasFormat} = await getWebGPUContext(canvas, device); 
    return {device, canvas, context, canvasFormat};  
}

export async function main(){
    const {device, canvas, context, canvasFormat} = await initializeGraphics();
    const cube = await createMesh(device, "meshes/monkey.glb");
    const shaderModule = await loadShader(device, '/shaders/basic.wgsl');
    console.log(shaderModule);
}