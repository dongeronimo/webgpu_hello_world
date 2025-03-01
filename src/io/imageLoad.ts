export async function loadPNGTexture(
    device: GPUDevice,
    imagePath: string
): Promise<GPUTexture> {
    // 1. Fetch the image file
    const response = await fetch(imagePath);
    const blob = await response.blob();
    // 2. Create an ImageBitmap directly from the blob
    const imageBitmap = await createImageBitmap(blob);
    // 3. Create the WebGPU texture with the correct dimensions
    const texture = device.createTexture({
        size: {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depthOrArrayLayers: 1,
        },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 4. Copy the image data to the texture using copyExternalImageToTexture
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depthOrArrayLayers: 1,
        }
    );

    // 5. Clean up the ImageBitmap
    imageBitmap.close();

    return texture;
}