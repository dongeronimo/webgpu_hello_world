import { GameObject } from "../engine/gameObject";
import GameObjectName from "./GameObjectName";
import GameObjectParent from "./GameObjectParent";
import styles from "./styles.module.css";

function GameObjectEditor(props: {
    go:GameObject,
}){
    const onNameChange = (name:string)=>{
        props.go.name = name;
    }
    return(
        <div className={styles.titleBar}>
            <GameObjectName goName={props.go.name} onNameChange={onNameChange}/>
            <GameObjectParent/>
        </div>
    )
}

export default GameObjectEditor;