import React from 'react'
import SceneIconToggle from './SceneIconToggle'
import NewGameObjectPanel from './NewGameObjectPanel'
import ResolutionSelector from './ResolutionSelector'
import GameObjectEditorPanel from './GameObjectEditorPanel'

function Editor() {
  return (
    <div>
      <SceneIconToggle/>
      <NewGameObjectPanel/>
      <ResolutionSelector/>
      <GameObjectEditorPanel/>
    </div>
  )
}

export default Editor