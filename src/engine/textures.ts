export function makeDepthTextureForRenderAttachment(device:GPUDevice, width:number, height:number){
    // Create a depth texture for proper 3D rendering
    const depthTexture = device.createTexture({
        size: [width, height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });    
    return depthTexture;
}