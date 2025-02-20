

export function createCanvas(): HTMLCanvasElement {
    // Either create a new canvas or get an existing one
    const canvas = document.querySelector('canvas') || document.createElement('canvas');
    
    // If we created a new canvas, we need to add it to the document
    if (!canvas.parentElement) {
        document.body.appendChild(canvas);
    }
    
    // Set the canvas size - ideally matching the device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    
    return canvas;
}

export async function initWebGPU(){
  // Check if WebGPU is supported
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported in your browser");
  }

  // Request adapter (similar to enumerating physical devices in Vulkan)
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance" // Like choosing a discrete GPU in Vulkan
  });
  
  if (!adapter) {
    throw new Error("No appropriate GPU adapter found");
  }

  // Create device with specific features (similar to logical device creation in Vulkan)
  const device = await adapter.requestDevice({
    requiredFeatures: [], // Similar to enabling device features in Vulkan
    requiredLimits: {}    // Similar to checking device limits in Vulkan
  });

  return device;
}

export async function getWebGPUContext(canvas: HTMLCanvasElement, device: GPUDevice) {
    // Get the WebGPU context from the canvas
    const context = canvas.getContext('webgpu');
    
    if (!context) {
        throw new Error('Failed to get WebGPU context');
    }

    // Configure the swap chain (similar to Vulkan swapchain creation)
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
        // 'opaque' is like VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR
        alphaMode: 'opaque',
        // Similar to choosing present modes in Vulkan
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    return { context, canvasFormat };
}