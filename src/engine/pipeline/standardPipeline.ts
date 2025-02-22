import { mat4 } from "gl-matrix";
import { BasePipeline } from "./basePipeline";

export class StandardPipeline extends BasePipeline {
  private vertexBufferLayout: GPUVertexBufferLayout;
  private dynamicMvpBufferSize: number;
  private maxObjects: number;

  constructor(device: GPUDevice, vertexBufferLayout: GPUVertexBufferLayout, maxObjects: number = 100) {
      super(device);
      this.vertexBufferLayout = vertexBufferLayout;
      this.maxObjects = maxObjects;

      // Calculate size for one model matrix (4x4 matrix = 16 floats = 64 bytes)
      const modelMatrixSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
      // Align to 256 bytes as required by WebGPU for dynamic buffers
      this.dynamicMvpBufferSize = Math.ceil(modelMatrixSize / 256) * 256;
  }

  getDynamicOffsetSize(): number {
      return this.dynamicMvpBufferSize;
  }

  async initialize(): Promise<void> {
      // 1. Create shader module
      const shaderModule = await this.createShaderModule('/shaders/basic.wgsl');

      // 2. Create uniform buffers
      // Buffer for model matrices (one per instance)
      const modelMatricesBuffer = this.createUniformBuffer(
          'modelMatrices',
          this.dynamicMvpBufferSize * this.maxObjects,
          GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      );

      // Buffer for view and projection matrices (shared across instances)
      const vpBuffer = this.createUniformBuffer(
          'vpMatrix',
          2 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT,  // Two mat4: view and projection
          GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      );

      // 3. Create bind group layout
      const bindGroupLayout = this.createBindGroupLayout([
          {
              // Dynamic uniform buffer for model matrices
              binding: 0,
              visibility: GPUShaderStage.VERTEX,
              buffer: {
                  type: 'uniform',
                  hasDynamicOffset: true,
                  minBindingSize: 4 * 4 * Float32Array.BYTES_PER_ELEMENT
              }
          },
          {
              // Static uniform buffer for view-projection matrices
              binding: 1,
              visibility: GPUShaderStage.VERTEX,
              buffer: {
                  type: 'uniform',
                  hasDynamicOffset: false,
                  minBindingSize: 2 * 4 * 4 * Float32Array.BYTES_PER_ELEMENT
              }
          }
      ]);

      // 4. Create bind group
      const bindGroup = this.device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
              {
                  binding: 0,
                  resource: {
                      buffer: modelMatricesBuffer,
                      offset: 0,
                      size: 4 * 4 * Float32Array.BYTES_PER_ELEMENT
                  }
              },
              {
                  binding: 1,
                  resource: {
                      buffer: vpBuffer
                  }
              }
          ]
      });

      this.bindGroups.set('transform', bindGroup);

      // 5. Create pipeline layout
      const pipelineLayout = this.device.createPipelineLayout({
          bindGroupLayouts: [bindGroupLayout]
      });

      // 6. Create the actual render pipeline
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
  }

  // Method to update a specific instance's model matrix
  updateModelMatrix(index: number, transform: mat4): void {
    const modelMatrix = transform;
    // Make sure we're passing a Float32Array
    const modelMatrixData = new Float32Array(modelMatrix);
    this.updateUniformBuffer(
        'modelMatrices',
        modelMatrixData,  // Now it's definitely a Float32Array
        index * this.dynamicMvpBufferSize
    );
  }

  // Method to update view-projection matrices
  updateViewProjection(viewMatrix: mat4, projMatrix: mat4): void {
    const vpData = new Float32Array(32); // Space for two mat4s
    // Make sure we're passing Float32Arrays
    vpData.set(new Float32Array(viewMatrix), 0);
    vpData.set(new Float32Array(projMatrix), 16);
    this.updateUniformBuffer('vpMatrix', vpData);
  }
}