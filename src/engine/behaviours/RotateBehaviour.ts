import { vec3 } from "gl-matrix";
import { Deg2Rad } from "../../core/math";
import { Behaviour, GameObject, Transform} from "../gameObject";

export class RotateBehaviour extends Behaviour {
    private angle:number = 0;
    private axis:vec3 = [0,1,0];
    private speed:number = Deg2Rad(90.0);
    private transform:Transform;

    constructor(owner:GameObject) {
        super(owner);
        this.transform = this.owner.getComponent(Transform.name)! as Transform;
    }
    public start() {
        super.start();
        this.axis[0] =  Math.random() * 2 - 1;
        this.axis[1] =  Math.random() * 2 - 1;
        this.axis[2] =  Math.random() * 2 - 1;
        vec3.normalize(this.axis, this.axis);
    }
    
    public update(deltaTime: number){
        super.update(deltaTime);
        this.angle = this.angle + this.speed * deltaTime;
        this.transform.rotationFromAngleAxis(this.angle, this.axis);
    }
}