import { Mesh } from "../mesh";
import { BasePipeline } from "../pipeline/basePipeline";
import { PickerPipeline } from "../pipeline/pickerPipeline";

export class GpuPickerService {
    private colorTexture: GPUTexture;
    private colorTextureView: GPUTextureView;
    public getColorTextureView():GPUTextureView { return this.colorTextureView;}
    private depthTexture: GPUTexture;
    private depthTextureView: GPUTextureView;
    public getDepthTextureView():GPUTextureView { return this.depthTextureView;}
    private readBuffer: GPUBuffer;
    private stagingBuffer: GPUBuffer;
    private canvasWidth: number;
    private canvasHeight: number;

    private pickOperationActive = false;
    private pendingPickRequest = false; 

    public setPendingPickRequest(){
        this.pendingPickRequest = true;
    }

    public setPickOperationActive() {
        this.pendingPickRequest = false;
        this.pickOperationActive = true; 
    }
    public pickOperationFinished() {
        this.pendingPickRequest = false;
        this.pickOperationActive = false;
    }
    public shouldRunPicking(){
        return this.pendingPickRequest && !this.pickOperationActive;
    }

    public destroy(){
        this.colorTexture.destroy();
        this.depthTexture.destroy();
        this.readBuffer.destroy();
        this.stagingBuffer.destroy();
    }
    constructor(device: GPUDevice, format:GPUTextureFormat, canvasWidth:number, canvasHeight:number){
        this.colorTexture = device.createTexture({
            label: "gpuPickerRenderPassColorTexture",
            size: { width: canvasWidth, height: canvasHeight, depthOrArrayLayers: 1 },
            format: format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        });
        this.colorTextureView = this.colorTexture.createView();
         
         this.depthTexture = device.createTexture({
            label: "gpuPickerRenderPassDepthTexture",
            size: {  width: canvasWidth, height: canvasHeight, depthOrArrayLayers: 1 },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthTextureView = this.depthTexture.createView();
        
        // Create buffers for reading back the picked pixel
        this.readBuffer = device.createBuffer({
            label: "GpuPickerRenderPass readBuffer",
            size: 4, // RGBA8Unorm = 4 bytes
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        
        this.stagingBuffer = device.createBuffer({
            label:"GpuPickerRenderPass stagingBuffer",
            size: 256,
            usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        });
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;
    }

    public setViewport(mouseX:number, mouseY:number, passEncoder:GPURenderPassEncoder){
        if(mouseX<0) mouseX = 0;
        if(mouseY<0) mouseY = 0;
        passEncoder.setViewport(
            0,                  // x offset
            0,                  // y offset
            this.canvasWidth,        // width of the entire canvas/texture
            this.canvasHeight,       // height of the entire canvas/texture
            0,                  // min depth
            1                   // max depth
        );
        
        // Also set the scissor rect to match the viewport
        passEncoder.setScissorRect(
            mouseX,             // x offset at mouse position
            mouseY,             // y offset at mouse position
            1,                  // width of 1 pixel
            1                   // height of 1 pixel
        );
    }

    public readTexture(commandEncoder: GPUCommandEncoder, mouseX: number, mouseY: number) {
        // Copy the result from the texture to the staging buffer
        commandEncoder.copyTextureToBuffer(
            { texture: this.colorTexture, mipLevel: 0, origin: { x: mouseX, y: mouseY, z: 0 } },
            { buffer: this.stagingBuffer, bytesPerRow: 256, rowsPerImage: 1 },
            { width: 1, height: 1, depthOrArrayLayers: 1 }
        );
        
        // Copy from staging buffer to the read buffer
        commandEncoder.copyBufferToBuffer(
            this.stagingBuffer, 0,
            this.readBuffer, 0,
            4
        );
    }

    // Read back the object ID from the GPU
    async readPickedObjectId(): Promise<number> {
        // Map the read buffer to read back the picked pixel
        await this.readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Uint8Array(this.readBuffer.getMappedRange());
        // Convert RGBA to object ID
        const objectId = 
            data[0] +
            (data[1] << 8) +
            (data[2] << 16) +
            (data[3] << 24);
        
        // Unmap the buffer
        this.readBuffer.unmap();
        
        return objectId;
    }
    private gpuPickerRenderPassEncoder:GPURenderPassEncoder|null = null;
    private pickerPipeline:PickerPipeline|null = null;
    private pickerCommandEncoder:GPUCommandEncoder|null = null;
    private x:number = 0;
    private y:number = 0;
    public beginPick(device: GPUDevice, pickerPipeline:PickerPipeline, x:number, y:number){
        this.setPickOperationActive();
        this.pickerCommandEncoder = device.createCommandEncoder();
        this.pickerCommandEncoder.label = "PickerCommandEncoder";
        this.gpuPickerRenderPassEncoder = this.pickerCommandEncoder.beginRenderPass({
            label: "gpuPickerRenderPassEncoder",
            colorAttachments: [{
                view: this.getColorTextureView(),
                clearValue: {r:0, g:0, b:0, a:0.0},
                loadOp: 'clear',
                storeOp:'store',
            }],
            depthStencilAttachment: {
                view: this.getDepthTextureView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });
        this.pickerPipeline = pickerPipeline;
        this.gpuPickerRenderPassEncoder.setPipeline(pickerPipeline.getPipeline());
        this.setViewport(x, y, this.gpuPickerRenderPassEncoder);
        this.x = x;
        this.y = y;
    }

    public drawForPicking(offset:number, mesh:Mesh){
        this.gpuPickerRenderPassEncoder!.setBindGroup(0, this.pickerPipeline!.getBindGroup('main'), [offset]);
        this.gpuPickerRenderPassEncoder!.setVertexBuffer(0, mesh.vertexBuffer);
        this.gpuPickerRenderPassEncoder!.setIndexBuffer(mesh.indexBuffer, 'uint16');    
        this.gpuPickerRenderPassEncoder!.drawIndexed(mesh.indexCount); 
    }

    public endPick(device:GPUDevice){
        this.gpuPickerRenderPassEncoder!.end();
        this.readTexture(this.pickerCommandEncoder!, this.x, this.y);
        device.queue.submit([this.pickerCommandEncoder!.finish()]);
        
    }
}
