import { GameManager } from "../core/gameManager"

function GameObjectParent(props: { goId: number, currentParentId: number, changeParent:(parentId:number)=>void}) {
    const isRoot = props.goId === 1;
    if (isRoot) {
        return (<div></div>)
    } else {
        const gameObjects = GameManager.getInstance().getGameObjects().filter(go => go.id !== props.goId).map(go => {
            return { id: go.id, name: go.name }
        }).map(x => {
            return (
                <option key={x.id} value={x.id}>
                    {x.name}
                </option>
            )
        });
        const handleChange = (event: React.ChangeEvent<HTMLSelectElement>)=>{
            const numericValue = Number(event.target.value);
            props.changeParent(numericValue);
        };
        return (
            <div>
                <span>parent:</span>
                <select value={props.currentParentId} onChange={handleChange}> {gameObjects}</select>
            </div>
        )
    }
}

export default GameObjectParent