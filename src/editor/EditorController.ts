import { mat4 } from "gl-matrix";
import { Transform } from "../engine/gameObject";
import { createMesh, Mesh } from "../engine/mesh";
import { IconPipeline } from "../engine/pipeline/iconPipeline";
import { loadPNGTexture } from "../io/imageLoad";

export class EditorController {
    private iconPlaneMesh: Mesh | null = null;
    private gameObjectIcon: GPUTexture | null = null;
    private gameObjectIconOn: boolean = true;
    private iconPipeline: IconPipeline | null = null;
    public setGameObjectIconToggle(x: boolean) {
        this.gameObjectIconOn = x;
    }
    public getGameObjectIconToggle(): boolean {
        return this.gameObjectIconOn;
    }

    public async initialize(device: GPUDevice) {
        this.iconPlaneMesh = await createMesh(device, "meshes/plane.glb");
        this.gameObjectIcon = await loadPNGTexture(device, 'icons/gameObject.png');
        const iconMap = new Map<string, GPUTexture>();
        iconMap.set('icons/gameObject.png', this.gameObjectIcon);
        this.iconPipeline = new IconPipeline(device, this.iconPlaneMesh.vertexBufferLayout, 1000,
            iconMap, this.iconPlaneMesh);
        await this.iconPipeline.initialize();
    }
    // Method to update view-projection matrices
    updateViewProjection(viewMatrix: mat4, projMatrix: mat4): void {
        const vpData = new Float32Array(32); // Space for two mat4s
        // Make sure we're passing Float32Arrays
        vpData.set(new Float32Array(viewMatrix), 0);
        vpData.set(new Float32Array(projMatrix), 16);
        this.iconPipeline!.updateUniformBuffer('vpMatrix', vpData);
    }
    // Method to update a specific instance's model matrix
    updateModelMatrix(index: number, transform: mat4): void {
        const modelMatrix = transform;
        // Make sure we're passing a Float32Array
        const modelMatrixData = new Float32Array(modelMatrix);
        this.iconPipeline!.updateUniformBuffer(
            'modelMatrices',
            modelMatrixData,  // Now it's definitely a Float32Array
            index * this.iconPipeline!.getDynamicOffsetSize()
        );
    }
    public iconsRenderPass(commandEncoder: GPUCommandEncoder, targetColor: GPUTextureView,
        targetDepth: GPUTextureView, transforms: Transform[]
    ) {
        const renderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: targetColor,
                clearValue: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: targetDepth,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });
        renderPassEncoder.setPipeline(this.iconPipeline!.getPipeline());
        //draw transforms
        transforms.map((t, i) => {
            const dynamicOffset: number = i * this.iconPipeline!.getDynamicOffsetSize();
            return { offset: dynamicOffset, icon: 'icons/gameObject.png' };
        }).forEach(x => {
            this.iconPipeline?.draw(renderPassEncoder, x.offset, x.icon);
        });
        //end the pass
        renderPassEncoder.end();
    }
}