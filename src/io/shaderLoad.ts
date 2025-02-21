export async function loadShader(device: GPUDevice, path: string): Promise<GPUShaderModule> {
    // Fetch the shader file from the server
    const response = await fetch(path);
    
    // Check if the fetch was successful
    if (!response.ok) {
        throw new Error(`Failed to load shader: ${path}`);
    }
    
    // Get the shader code as text
    const shaderCode = await response.text();
    
    // Create a shader module from the code
    const shaderModule = device.createShaderModule({
        code: shaderCode,
    });
    shaderModule.label = path;
    return shaderModule;
}