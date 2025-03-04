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
    return (
        <div>
            <div><span>Local Transform</span></div>
            <div><span>Position</span></div>
            <div>
                <NumericInput value={position[0]+""} onChange={onPXChange}/>
                <NumericInput value={position[1]+""} onChange={onPYChange}/>
                <NumericInput value={position[2]+""} onChange={onPZChange}/>
            </div>
            <div><span>Rotation</span></div>
            <div><span>Scale</span></div>
        </div>
    )
}

export default TransformEditor;