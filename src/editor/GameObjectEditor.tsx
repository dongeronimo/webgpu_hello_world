import { GameManager } from "../core/gameManager";
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
    const onParentChange = (parentId:number)=>{
        const newParent = GameManager.getInstance().getGameObjects().find(go=>go.id === parentId);
        props.go.setParent(newParent!);
    }
    const parentId = props.go.GetParent()!=null? props.go.GetParent()!.id : 0;
    return(
        <div className={styles.titleBar}>
            <GameObjectName goName={props.go.name} onNameChange={onNameChange}/>
            <GameObjectParent goId={props.go.id} currentParentId={parentId} changeParent={onParentChange}/>
        </div>
    )
}

export default GameObjectEditor;