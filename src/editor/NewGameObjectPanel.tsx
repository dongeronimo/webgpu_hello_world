import React from 'react'
import { EditorController } from './EditorController';

function NewGameObjectPanel () {
    const handleClick = () => {
        EditorController.editorInstance?.newGameObject();
    };
    return (
        <div>
            <button onClick={handleClick}>New GameObject</button>
        </div>
    )
}

export default NewGameObjectPanel;