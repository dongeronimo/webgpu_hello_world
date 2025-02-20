import { createCanvas, getWebGPUContext, initWebGPU } from "../engine/webgpu";

async function initializeGraphics() {
    const device = await initWebGPU();
    const canvas = createCanvas();
    const {context, canvasFormat} = await getWebGPUContext(canvas, device); 
    return {device, canvas, context, canvasFormat};  
}

export async function main(){
    const {device, canvas, context, canvasFormat} = await initializeGraphics();
    debugger;
}