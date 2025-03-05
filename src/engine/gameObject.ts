import { mat4, quat, vec3 } from "gl-matrix";
import { Mesh } from "./mesh";
import { degToRad, radToDeg } from "three/src/math/MathUtils.js";

let counter: number = 0;

export class GameObject {
    public readonly id: number;
    public name: string;
    private components: Map<string, Component> = new Map();
    private children: Array<GameObject> = new Array();
    private parent: GameObject | null = null;
    public GetParent(): GameObject | null {
        return this.parent;
    }
    constructor(name: string) {
        this.id = ++counter;
        this.name = name;
    }
    public addComponent(c: Component) {
        const name = c.constructor.name;
        this.components.set(name, c);
    }
    public getComponent(typename: string): Component | undefined {
        return this.components.get(typename);
    }
    public setParent(p: GameObject) {
        this.parent = p;
        this.parent.children.push(p);
    }
}

export class Component {
    public readonly owner: GameObject;
    public constructor(owner: GameObject) {
        this.owner = owner;
        owner.addComponent(this);
    }
}


export class MeshComponent extends Component {
    public readonly mesh: Mesh;
    constructor(owner: GameObject, mesh: Mesh) {
        super(owner);
        this.mesh = mesh;
    }
}

export class Behaviour extends Component {
    protected alreadyStarted: boolean = false;
    public IsStarted(): boolean { return this.alreadyStarted; }
    constructor(owner: GameObject) {
        super(owner);
    }
    public start() {
        this.alreadyStarted = true;
    }
    public update(deltaTime: number) {

    }
}

export class Transform extends Component {
    public static defaultAngle = 90.0;
    public static defaultAxis:vec3 = [1,0,0];
    private pos: vec3 = vec3.create();
    private scale: vec3 = [1.0, 1.0, 1.0];
    private rotation: quat = quat.create();
    private localTransform: mat4 = mat4.create();
    public getLocalTransform(): mat4 { return this.localTransform; }
    constructor(owner: GameObject) {
        super(owner);
        this.calculateLocalTransform();   
    }
    public getPosition(): vec3 { return this.pos; }
    public getScale(): vec3 { return this.scale; }
    public getAxisAngle(): { axis: vec3, angle: number } {
        let axis = vec3.create();
        let angle = radToDeg(quat.getAxisAngle(axis, this.rotation));
        return {
            axis: axis, angle: angle
        }
    }
    private calculateLocalTransform(): mat4 {

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
    public rotationFromAngleAxis(angle: number, axis: vec3) {
        vec3.normalize(axis, axis);
        quat.setAxisAngle(this.rotation, axis, angle);
        this.calculateLocalTransform();
    }
    public setPosition(p: vec3) {
        this.pos[0] = p[0];
        this.pos[1] = p[1];
        this.pos[2] = p[2];
        this.calculateLocalTransform();
    }
    public setScale(s: vec3) {
        this.scale[0] = s[0]
        this.scale[1] = s[1]
        this.scale[2] = s[2]
        this.calculateLocalTransform();
    }
    public getEuler(): vec3 {
        this.calculateLocalTransform()
        // Convert quaternion to rotation matrix
        const rotMat = mat4.create();
        mat4.fromQuat(rotMat, this.rotation);

        // Extract Euler angles from the rotation matrix
        const euler = vec3.create();

        // Extract pitch (X-axis rotation)
        euler[0] = Math.asin(-rotMat[9]); // -m23

        // Check for gimbal lock
        if (Math.abs(rotMat[9]) < 0.99999) {
            // No gimbal lock
            euler[1] = Math.atan2(rotMat[8], rotMat[10]);  // m13, m33
            euler[2] = Math.atan2(rotMat[1], rotMat[5]);   // m21, m22
        } else {
            // Gimbal lock occurred
            euler[1] = Math.atan2(-rotMat[2], rotMat[0]);  // -m31, m11
            euler[2] = 0;
        }

        return euler;
    }
    public fromEuler(euler: vec3) {
        const [x, y, z] = euler;
        const quaternion = quat.create();

        // Convert Euler angles (in radians) to a quaternion
        const degX = /*degToRad*/(x);
        const degY = /*degToRad*/(y);
        const degZ = /*degToRad*/(z);

        // Use the built-in function (order: XYZ)
        quat.fromEuler(quaternion, degX, degY, degZ);
        this.rotation = quaternion;
        this.calculateLocalTransform()
    }
    public getWorldTransform(): mat4 {
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