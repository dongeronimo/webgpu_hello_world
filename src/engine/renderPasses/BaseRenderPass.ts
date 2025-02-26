/**
 * Base class for all render passes
 */
export abstract class BaseRenderPass {
    protected device: GPUDevice;
    protected format: GPUTextureFormat;
  
    constructor(device: GPUDevice, format: GPUTextureFormat) {
      this.device = device;
      this.format = format;
    }
  
    /**
     * Initialize the render pass's resources
     */
    abstract initialize(): Promise<void>;
  
    /**
     * Render using this pass
     * @param commandEncoder The command encoder to use
     */
    abstract render(commandEncoder: GPUCommandEncoder): void;
  
    /**
     * Clean up any resources used by this render pass
     */
    abstract destroy(): void;
  }