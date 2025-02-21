import { BasePipeline } from "./basePipeline";
///This pipeline is for the hello shader and meshes from blender.
export class StandardPipeline extends BasePipeline {
    private vertexBufferLayout: GPUVertexBufferLayout;
    private dynamicMvpBufferSize: number;
    private maxObjects: number;
    
    constructor(device: GPUDevice, vertexBufferLayout: GPUVertexBufferLayout, maxObjects: number = 100) {
      super(device);
      this.vertexBufferLayout = vertexBufferLayout;
      this.maxObjects = maxObjects;
      
      // Calculate size of a single MVP data instance (3 mat4x4s = 192 bytes)
      const mvpStructSize = 4 * 4 * 3 * Float32Array.BYTES_PER_ELEMENT; // 3 matrices, 4x4 floats each
      
      // Calculate aligned size for dynamic offset (typically 256-byte aligned)
      this.dynamicMvpBufferSize = Math.ceil(mvpStructSize / 256) * 256;
    }
    
    async initialize(): Promise<void> {
      // 1. Create shader module
      const shaderModule = await this.createShaderModule('/shaders/basic.wgsl');
      
      // 2. Create bind group layouts for our uniforms
      const mvpBindGroupLayout = this.createBindGroupLayout([
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
            hasDynamicOffset: true, // This is what makes it a dynamic uniform buffer
            minBindingSize: 3 * 4 * 4 * 4, // Minimum size for our MVP data (3 mat4x4)
          }
        },
        // You can add more bindings here for textures, samplers, etc.
      ]);
      
      // 3. Create pipeline layout
      const pipelineLayout = this.createPipelineLayout();
      
      // 4. Create the actual render pipeline
      this.pipeline = this.device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: 'vertexMain',
          buffers: [this.vertexBufferLayout]
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragmentMain',
          targets: [
            {
              format: navigator.gpu.getPreferredCanvasFormat()
            }
          ]
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'back'
        },
        depthStencil: {
          format: 'depth24plus',
          depthWriteEnabled: true,
          depthCompare: 'less'
        }
      });
      
      // 5. Create the dynamic uniform buffer for all objects
      const mvpBuffer = this.createUniformBuffer(
        'mvpBuffer', 
        this.dynamicMvpBufferSize * this.maxObjects
      );
      
      // 6. Create the bind group that uses this buffer
      const mvpBindGroup = this.device.createBindGroup({
        layout: mvpBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: mvpBuffer,
              offset: 0,
              size: 3 * 4 * 4 * 4 // Size of a single MVP data instance
            }
          }
        ]
      });
      
      this.bindGroups.set('mvp', mvpBindGroup);
    }
    
    // Method to update MVP data for a specific object
    updateObjectMvp(objectIndex: number, modelMatrix: Float32Array, viewMatrix: Float32Array, projMatrix: Float32Array): void {
      // Create a temporary buffer to hold all three matrices
      const mvpData = new Float32Array(3 * 16); // 3 matrices, 16 elements each
      
      // Copy matrices into the buffer
      mvpData.set(modelMatrix, 0);      // Offset 0
      mvpData.set(viewMatrix, 16);      // Offset 16 floats
      mvpData.set(projMatrix, 32);      // Offset 32 floats
      
      // Calculate the byte offset for this object in the dynamic buffer
      const offset = objectIndex * this.dynamicMvpBufferSize;
      
      // Update just this object's portion of the buffer
      this.updateUniformBuffer('mvpBuffer', mvpData, offset);
    }
    
    // Helper method for rendering an object with its MVP data
    render(encoder: GPURenderPassEncoder, objectIndex: number): void {
      const dynamicOffset = objectIndex * this.dynamicMvpBufferSize;
      
      // Set the pipeline
      encoder.setPipeline(this.pipeline);
      
      // Set the bind group with the dynamic offset
      encoder.setBindGroup(0, this.getBindGroup('mvp'), [dynamicOffset]);
      
      // The actual drawing commands would come from the caller
      // (encoder.draw or encoder.drawIndexed)
    }
  }