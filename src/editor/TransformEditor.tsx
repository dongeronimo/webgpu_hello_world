import { Transform } from "../engine/gameObject";
import NumericInput from "./NumericInput";

function TransformEditor(props:{transform:Transform}) {
    const position = props.transform.getPosition();
    const scale = props.transform.getScale();
    const axisAngle = props.transform.getAxisAngle();
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