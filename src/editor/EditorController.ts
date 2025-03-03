import { mat4, vec3 } from "gl-matrix";
import { GameObject, Transform } from "../engine/gameObject";
import { createMesh, Mesh } from "../engine/mesh";
import { IconPipeline } from "../engine/pipeline/iconPipeline";
import { loadPNGTexture } from "../io/imageLoad";
import { getRotationToDirection } from "../core/math";

export class EditorController {
    public static editorInstance:EditorController|undefined = undefined;
    private iconPlaneMesh: Mesh | null = null;
    public getIconPlaneMesh():Mesh{return this.iconPlaneMesh!;}
    private gameObjectIcon: GPUTexture | null = null;
    private gameObjectIconOn: boolean = true;
    private iconPipeline: IconPipeline | null = null;
    private root: GameObject | null = null;
    private gameObjects: Array<GameObject>;
    private selectedGameObject: GameObject|undefined = undefined;
    public setRoot(r:GameObject){
        this.root = r;
    }
    constructor(gameObjects:Array<GameObject>){
        EditorController.editorInstance = this;
        this.gameObjects = gameObjects;
    }
    public setGameObjectIconToggle(x: boolean) {
        this.gameObjectIconOn = x;
    }
    public getGameObjectIconToggle(): boolean {
        return this.gameObjectIconOn;
    }

    public newGameObject(){
        const newGO = new GameObject("gameObject");
        newGO.setParent(this.root!);
        const t = new Transform(newGO);
        this.gameObjects.push(newGO);
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
    updateViewProjection(viewMatrix: mat4, projMatrix: mat4, cameraPosition:vec3, fov:number): void {
        this.iconPipeline!.updateViewProjection(viewMatrix, projMatrix, cameraPosition, fov);
    }
    // Method to update a specific instance's model matrix
    updateIconModelMatrix(index: number, transform: mat4): void {
        const modelMatrix = transform;
        // Make sure we're passing a Float32Array
        const modelMatrixData = new Float32Array(modelMatrix);
        this.iconPipeline!.updateUniformBuffer(
            'modelMatrices',
            modelMatrixData,  // Now it's definitely a Float32Array
            index * this.iconPipeline!.getDynamicOffsetSize()
        );
    }

    public calculateIconModelMatrix(worldTransform: mat4, eye:vec3): mat4{
        if(this.gameObjectIconOn){
            const iconPosition: vec3 = vec3.create();
            mat4.getTranslation(iconPosition, worldTransform);
            let iconTransform = mat4.create();
            mat4.translate(iconTransform, iconTransform, iconPosition);
            let direction = vec3.create();
            vec3.sub(direction, eye, iconPosition);
            const rotation = getRotationToDirection(direction);
            const rotationMatrix = mat4.create();
            mat4.fromQuat(rotationMatrix, rotation);
            mat4.multiply(iconTransform, iconTransform, rotationMatrix);
            mat4.scale(iconTransform, iconTransform, [1, 1, 1]);
            return iconTransform;
        }
        else{
            let m = mat4.create();
            m[0] = 0; m[1] = 0; m[2] = 0; m[3] = 0;
            m[4] = 0; m[5] = 0; m[6] = 0; m[7] = 0;
            m[8] = 0; m[9] = 0; m[10] = 0; m[11] = 0;
            m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 0;
            return m;
        }
    }

    public setSelectedGameObject(go:GameObject|undefined){
        this.selectedGameObject = go;
    }
    public getSelectedGameObject():GameObject|undefined {
        return this.selectedGameObject;
    }
    public iconsRenderPass(commandEncoder: GPUCommandEncoder, targetColor: GPUTextureView,
        targetDepth: GPUTextureView, transforms: Transform[]
    ) {
        if(this.gameObjectIconOn){
            const renderPassEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: targetColor,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'load',
                    storeOp: 'store'
                }],
                depthStencilAttachment: {
                    view: targetDepth,
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'discard'
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
}