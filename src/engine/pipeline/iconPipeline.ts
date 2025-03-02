import { mat4, vec3 } from "gl-matrix";
import { loadShader } from "../../io/shaderLoad";
import { BasePipeline } from "./basePipeline";
import { Mesh } from "../mesh";
import { label } from "three/tsl";

export class IconPipeline extends BasePipeline {
    private maxObjects: number;
    private vertexBufferLayout: GPUVertexBufferLayout;
    private dynamicMvpBufferSize: number;
    public getDynamicOffsetSize():number {return this.dynamicMvpBufferSize;}
    private textureBindGroupLayout: GPUBindGroupLayout;
    private quad:Mesh;
    constructor(device: GPUDevice, vertexBufferLayout: GPUVertexBufferLayout, maxObjects: number = 1000,
        icons: Map<string, GPUTexture>, mesh:Mesh) {
        super(device);
        this.quad = mesh;
        this.vertexBufferLayout = vertexBufferLayout;
        this.maxObjects = maxObjects;
        // Calculate size for one model matrix (4x4 matrix = 16 floats = 64 bytes)
        const modelMatrixSize = 4 * 4 * Float32Array.BYTES_PER_ELEMENT;
        // Align to 256 bytes as required by WebGPU for dynamic buffers
        this.dynamicMvpBufferSize = Math.ceil(modelMatrixSize / 256) * 256;
        this.textureBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float',
                        viewDimension: '2d'
                    }
                }
            ]
        });
        const sampler = device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
        icons.forEach((v, k) => {
            const textureBindGroup = device.createBindGroup({
                label: `icon${k}`,
                layout: this.textureBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: sampler
                    },
                    {
                        binding: 1,
                        resource: v.createView()
                    }
                ]
            });
            this.bindGroups.set(k, textureBindGroup);
        });
    }
    async initialize(): Promise<void> {
        const shaderModule = await loadShader(this.device, "shaders/icon.wgsl");
        // Buffer for model matrices (one per instance)
        const modelMatricesBuffer = this.createUniformBuffer(
            'modelMatrices',
            this.dynamicMvpBufferSize * this.maxObjects,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );
        // Buffer for view and projection matrices (shared across instances)
        const vpBufferSize =(2 * 4 * 4 + 4) * Float32Array.BYTES_PER_ELEMENT;  // Two mat4: view and projection, one vec4: cameraPosAndFov
             
        const vpBuffer = this.createUniformBuffer(
            'vpMatrix',
            vpBufferSize,  // Two mat4: view and projection, one vec4: cameraPosAndFov
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );
        // Create the bind group layout for textures
        const uniformsBindGroupLayout = this.createBindGroupLayout([
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
                    minBindingSize: vpBufferSize
                }
            }
        ]);
        const transformsBindGroup = this.device.createBindGroup({
            layout: uniformsBindGroupLayout,
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
        this.bindGroups.set('transform', transformsBindGroup);
        const pipelineLayout = this.device.createPipelineLayout({
            label: 'iconPipelineLayout',
            bindGroupLayouts: [
                uniformsBindGroupLayout,  // Group 0 for your matrix uniforms
                this.textureBindGroupLayout    // Group 1 for textures
            ]
        });
        // 6. Create the actual render pipeline
        this.pipeline = this.device.createRenderPipeline({
            label: 'iconPipeline',
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
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            }
                        }
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
    updateViewProjection(viewMatrix: mat4, projMatrix: mat4, cameraPos:vec3, fov:number): void {
        const vpData = new Float32Array(32 + 4); // Space for two mat4s and one vec4
        // Make sure we're passing Float32Arrays
        vpData.set(new Float32Array(viewMatrix), 0);
        vpData.set(new Float32Array(projMatrix), 16);
        vpData.set(new Float32Array(cameraPos), 32);
        const _temp = [fov];
        vpData.set(_temp, 35);
        this.updateUniformBuffer('vpMatrix', vpData);
    }

    public draw(renderPassEncoder:GPURenderPassEncoder, offset:number, iconId:string){
        renderPassEncoder.setBindGroup(0, this.getBindGroup('transform'), [offset]);
        const iconBindGroup = this.getBindGroup(iconId);        
        renderPassEncoder.setBindGroup(1, iconBindGroup);
        renderPassEncoder.setVertexBuffer(0,this.quad.vertexBuffer);
        renderPassEncoder.setIndexBuffer(this.quad.indexBuffer, 'uint16');    
        renderPassEncoder.drawIndexed(this.quad.indexCount);
    }
}