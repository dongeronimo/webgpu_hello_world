import { mat4, quat, vec3 } from "gl-matrix";
import { Mesh } from "./mesh";

let counter:number = 0;

export class GameObject {
    public readonly id:number;
    public readonly name:string;
    private components:Map<string, Component>= new Map();
    private children:Array<GameObject> = new Array();
    private parent:GameObject|null = null;
    public GetParent():GameObject|null {
        return this.parent; 
    }
    constructor(name:string){
        this.id = ++counter;
        this.name = name;
    }
    public addComponent(c:Component){
        const name = c.constructor.name;
        this.components.set(name, c);
    }
    public getComponent(typename:string) : Component|undefined{
        return this.components.get(typename);
    }
    public setParent(p:GameObject){
        this.parent = p;
        this.parent.children.push(p);
    }
}

export class Component {
    public readonly owner:GameObject;
    public constructor(owner:GameObject){
        this.owner = owner;
        owner.addComponent(this);
    }
}


//////DO NOT USE THIS FOR NOW/////
export class MeshComponent extends Component {
    public readonly mesh:Mesh;
    constructor(owner:GameObject, mesh:Mesh){
        super(owner);
        this.mesh = mesh;
    }
}
//////////////////////////////////
export class Behaviour extends Component {
    protected alreadyStarted:boolean = false;
    public IsStarted():boolean{return this.alreadyStarted;}
    constructor(owner:GameObject){
        super(owner);
    }
    public start(){
        this.alreadyStarted = true;
    }
    public update(deltaTime:number){

    }
}

export class Transform extends Component {
    private pos:vec3 = vec3.create();
    private scale:vec3 = [1.0, 1.0, 1.0];
    private rotation:quat = quat.create();
    private localTransform:mat4 = mat4.create();
    public getLocalTransform():mat4 {return this.localTransform;}
    constructor(owner:GameObject){
        super(owner);
        this.calculateLocalTransform();
    }
    private calculateLocalTransform():mat4 {
        // Reset to identity
        mat4.identity(this.localTransform);
        
        // First translate to position in world
        mat4.translate(this.localTransform, this.localTransform, this.pos);
        
        // Then apply rotation at that position
        const rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, this.rotation);
        mat4.multiply(this.localTransform, this.localTransform, rotationMatrix);
        
        // Finally scale
        mat4.scale(this.localTransform, this.localTransform, this.scale);

        return this.localTransform;
    }
    public rotationFromAngleAxis(angleInRad:number, axis:vec3){
        quat.setAxisAngle(this.rotation, axis, angleInRad);
        this.calculateLocalTransform();
    }
    public setPosition(p:vec3){
        this.pos[0] = p[0];
        this.pos[1] = p[1];
        this.pos[2] = p[2];
        this.calculateLocalTransform();
    }   
    
    public getWorldTransform():mat4{
        const worldTransform = mat4.create();
    
        // Start with the local transform
        mat4.copy(worldTransform, this.localTransform);
        
        // If this object has a parent, multiply by the parent's world transform
        const parent = this.owner.GetParent();
        if (parent) {
            // Get the parent's transform component
            const parentTransform = parent.getComponent("Transform") as Transform;
            if (parentTransform) {
                // Multiply local transform by parent's world transform
                const parentWorldTransform = parentTransform.getWorldTransform();
                mat4.multiply(worldTransform, parentWorldTransform, worldTransform);
            }
        }
        
        return worldTransform;    
    }
}