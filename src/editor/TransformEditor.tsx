import { degToRad, radToDeg } from "three/src/math/MathUtils.js";
import { Transform } from "../engine/gameObject";
import NumericInput from "./NumericInput";

function TransformEditor(props:{transform:Transform}) {
    const position = props.transform.getPosition();
    const scale = props.transform.getScale();
    const axisAngle = props.transform.getAxisAngle();
    const euler = props.transform.getEuler();
    const onPXChange = (e: string) =>{
        const v = Number(e);
        props.transform.setPosition([v, position[1], position[2]]);
    }
    const onPYChange = (e: string) =>{
        const v = Number(e);
        props.transform.setPosition([position[0], v, position[2]]);
    }
    const onPZChange = (e: string) =>{
        const v = Number(e);
        props.transform.setPosition([position[0], position[1], v]);
    }
    const onSXChange = (e:string)=>{
        const v = Number(e);
        props.transform.setScale([v, scale[1], scale[2]]);
    }
    const onSYChange = (e:string)=>{
        const v = Number(e);
        props.transform.setScale([scale[0], v, scale[2]]);
    }
    const onSZChange = (e:string)=>{
        const v = Number(e);
        props.transform.setScale([scale[0], scale[1], v]);
    }
    const onAXChange = (e:string) => {
        const v = Number(e);
        props.transform.rotationFromAngleAxis(degToRad(axisAngle.angle), 
            [v, axisAngle.axis[1], axisAngle.axis[2]]);
    }
    const onAYChange = (e:string) => {
        const v = Number(e);
        props.transform.rotationFromAngleAxis(degToRad(axisAngle.angle), 
            [axisAngle.axis[0], v, axisAngle.axis[2]]);
    }
    const onAZChange = (e:string) => {
        const v = Number(e);
        props.transform.rotationFromAngleAxis(degToRad(axisAngle.angle), 
            [axisAngle.axis[0], axisAngle.axis[1], v]);
    }
    const onAngleChange = (e:string) => {
        const v = Number(e);
        props.transform.rotationFromAngleAxis(v, 
            [axisAngle.axis[0], axisAngle.axis[1], axisAngle.axis[2]]);
    }
    const onEXChange = (e:string)=>{
        const v = Number(e);
        props.transform.fromEuler([v, euler[1], euler[2]])
    }
    const onEYChange = (e:string)=>{
        const v = Number(e);
        props.transform.fromEuler([euler[0], v, euler[2]])
    }
    const onEZChange = (e:string)=>{
        const v = Number(e);
        props.transform.fromEuler([euler[0], euler[1], v])
    }
    return (
        <div>
            <div><span>Local Transform</span></div>
            <div><span>Position</span></div>
            <div>
                <NumericInput value={position[0]+""} onChange={onPXChange} step={0.25}/>
                <NumericInput value={position[1]+""} onChange={onPYChange} step={0.25}/>
                <NumericInput value={position[2]+""} onChange={onPZChange} step={0.25}/>
            </div>
            <div><span>Rotation</span></div>
            <div>
                <span>Axis:</span>
                <NumericInput value={axisAngle.axis[0]+""} onChange={onAXChange} step={0.01}/>
                <NumericInput value={axisAngle.axis[1]+""} onChange={onAYChange} step={0.01}/>
                <NumericInput value={axisAngle.axis[2]+""} onChange={onAZChange} step={0.01}/>
                <div>Angle: 
                    <NumericInput value={axisAngle.angle+""} onChange={onAngleChange} step={1}/>
                </div>

            </div>
            
            <div><span>Scale</span></div>
            <div>
                <NumericInput value={scale[0]+""} onChange={onSXChange} step={0.25}/>
                <NumericInput value={scale[1]+""} onChange={onSYChange} step={0.25}/>
                <NumericInput value={scale[2]+""} onChange={onSZChange} step={0.25}/>
            </div>
        </div>
    )
}

export default TransformEditor;