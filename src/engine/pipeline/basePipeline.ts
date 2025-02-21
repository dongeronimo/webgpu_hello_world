export abstract class BasePipeline {
    protected device: GPUDevice;
    protected pipeline: GPURenderPipeline | null = null;
    protected bindGroupLayouts: GPUBindGroupLayout[] = [];
    protected uniformBuffers: Map<string, GPUBuffer> = new Map();
    protected bindGroups: Map<string, GPUBindGroup> = new Map();
    
    constructor(device: GPUDevice) {
      this.device = device;
    }
    
    // Changed to remove 'async' from the abstract declaration
    abstract initialize(): Promise<void>;
    
    protected async createShaderModule(path: string): Promise<GPUShaderModule> {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${path}`);
      }
      const shaderCode = await response.text();
      return this.device.createShaderModule({ code: shaderCode });
    }
    
    protected createUniformBuffer(
      name: string, 
      size: number, 
      usage: GPUBufferUsageFlags = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    ): GPUBuffer {
      // Create buffer with proper size alignment (usually 256 bytes for uniforms)
      const alignedSize = Math.ceil(size / 256) * 256;
      
      const buffer = this.device.createBuffer({
        size: alignedSize,
        usage: usage,
      });
      
      this.uniformBuffers.set(name, buffer);
      return buffer;
    }
    
    protected createBindGroupLayout(entries: GPUBindGroupLayoutEntry[]): GPUBindGroupLayout {
      const layout = this.device.createBindGroupLayout({ entries });
      this.bindGroupLayouts.push(layout);
      return layout;
    }
    
    protected createPipelineLayout(): GPUPipelineLayout {
      return this.device.createPipelineLayout({
        bindGroupLayouts: this.bindGroupLayouts,
      });
    }
    
    public updateUniformBuffer(name: string, data: ArrayBuffer, offset: number = 0): void {
      const buffer = this.uniformBuffers.get(name);
      if (!buffer) {
        throw new Error(`Uniform buffer '${name}' not found`);
      }
      this.device.queue.writeBuffer(buffer, offset, data);
    }
    
    public getBindGroup(name: string): GPUBindGroup {
      const bindGroup = this.bindGroups.get(name);
      if (!bindGroup) {
        throw new Error(`Bind group '${name}' not found`);
      }
      return bindGroup;
    }
    
    public getPipeline(): GPURenderPipeline {
      if (!this.pipeline) {
        throw new Error("Pipeline has not been initialized");
      }
      return this.pipeline;
    }
  }