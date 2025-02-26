import { loadShader } from "../../io/shaderLoad";
import { BasePipeline } from "./basePipeline";
import { mat4, vec4 } from "gl-matrix";

/**
 * Picker pipeline for GPU-based object picking
 * Extends BasePipeline with functionality to render objects with unique IDs
 */
export class PickerPipeline extends BasePipeline {
    // Format for the render target
    private format: GPUTextureFormat;
    // Maximum number of objects that can be picked
    private maxObjects: number;

    /**
     * Creates a new PickerPipeline
     * @param device The GPU device
     * @param format The texture format for the picker render target
     * @param maxObjects Maximum number of objects that can be picked
     */
    constructor(device: GPUDevice, format: GPUTextureFormat, maxObjects: number = 1000) {
        super(device);
        this.format = format;
        this.maxObjects = maxObjects;
    }

    /**
     * Create the bind group layout for the picker pipeline
     * @returns The GPUBindGroupLayout for the picker pipeline
     */
    protected createBindGroupLayout(): GPUBindGroupLayout {
        return this.device.createBindGroupLayout({
            entries: [
                {
                    // Model matrix and object ID
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                        hasDynamicOffset: true,
                    },
                },
                {
                    // View & Projection matrices
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform",
                    },
                },
            ],
        });
    }

    /**
     * Create vertex buffer layouts for the picker pipeline
     * @returns Array of GPUVertexBufferLayout objects
     */
    protected createVertexBufferLayouts(): GPUVertexBufferLayout[] {
        return [
            {
                arrayStride: (3 + 3 + 2) * 4, // position(3) + normal(3) + uv(2) floats
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        // normal
                        shaderLocation: 1,
                        offset: 3 * 4,
                        format: 'float32x3',
                    },
                    {
                        // uv
                        shaderLocation: 2,
                        offset: (3 + 3) * 4,
                        format: 'float32x2',
                    },
                ],
            },
        ];
    }

    /**
     * Initialize the pipeline
     */
    async initialize(): Promise<void> {
        // Load the picker shader
        const shaderModule = await loadShader(this.device, "./shaders/picker.wgsl");

        // Get the bind group layout
        const bindGroupLayout = this.createBindGroupLayout();

        // Create the pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        // Get the vertex buffer layouts
        const vertexBufferLayouts = this.createVertexBufferLayouts();

        // Create the pipeline
        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: vertexBufferLayouts,
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: this.format,
                    },
                ],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "back",
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
        });

        // Create the uniform buffer for object-specific data
        // Model matrix (4x4 floats = 64 bytes) + objectId (vec4 = 16 bytes) = 80 bytes
        // Align to 256 bytes for dynamic offsets as required by WebGPU spec
        const uniformBufferSize = 256; // Align to 256 bytes for dynamic offsets
        const objectsBuffer = this.createUniformBuffer(
            "objects",
            uniformBufferSize * this.maxObjects,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );

        // Create the view-projection uniform buffer
        const vpUniformBuffer = this.createUniformBuffer(
            "viewProjection",
            2 * 16 * 4, // Two 4x4 matrices (view and projection)
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        );

        // Create the main bind group that will be used with dynamic offsets
        const mainBindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: objectsBuffer,
                        offset: 0,
                        size: 80, // Size of the Uniforms struct (model matrix + objectId vec4)
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: vpUniformBuffer,
                    },
                },
            ],
        });

        // Store the bind group in the map
        this.bindGroups.set("main", mainBindGroup);

        console.log(`Created PickerPipeline with uniform buffer size: ${uniformBufferSize} * ${this.maxObjects} = ${uniformBufferSize * this.maxObjects} bytes`);
    }

    /**
     * Update the view-projection uniform buffer
     * @param viewMatrix The view matrix
     * @param projectionMatrix The projection matrix
     */
    updateViewProjection(viewMatrix: mat4, projectionMatrix: mat4): void {
        // Create a buffer to hold both matrices (32 floats = 128 bytes)
        const vpData = new Float32Array(32);
        
        // Write the matrices to the buffer
        vpData.set(viewMatrix as Float32Array, 0);
        vpData.set(projectionMatrix as Float32Array, 16);
        
        // Update the uniform buffer
        this.updateUniformBuffer("viewProjection", vpData);
    }

    /**
     * Update the object-specific uniform buffer
     * @param index The index of the object in the uniform buffer
     * @param modelMatrix The model matrix
     * @param objectId The unique ID for the object (will be encoded as color)
     */
    updateObjectSpecificUniformBuffer(index: number, modelMatrix: mat4, objectId: number): void {
        if (index >= this.maxObjects) {
            console.error(`Index ${index} exceeds maximum number of objects (${this.maxObjects})`);
            return;
        }

        // Calculate the offset for this object in the uniform buffer
        const offset = index * 256; // Aligned to 256 bytes
        
        // Create a data array for the uniform data
        // modelMatrix (16 floats) + objectId (stored in a vec4, only first component used)
        const data = new Float32Array(20); // 16 + 4 = 20 floats
        
        // Copy the model matrix
        data.set(modelMatrix as Float32Array, 0);
        
        // Create a vec4 for the object ID (using only first component)
        const idVec = vec4.fromValues(objectId, 0, 0, 0);
        data.set(idVec, 16);
        
        // Use BasePipeline's updateUniformBuffer with the offset
        this.updateUniformBuffer("objects", data, offset);
    }

    getDynamicOffsetSize(): number {
        return 256; // Must match the alignment used in updateObjectSpecificUniformBuffer
    }
}