import React from 'react'
import SceneIconToggle from './SceneIconToggle'
import NewGameObjectPanel from './NewGameObjectPanel'
import ResolutionSelector from './ResolutionSelector'

function Editor() {
  return (
    <div>
      <SceneIconToggle/>
      <NewGameObjectPanel/>
      <ResolutionSelector/>
    </div>
  )
}

export default Editor