# Hello World (provisory name)

My attempt to create a basic game engine for the web

Uses:
- webgpu
- typescript
- react
- threejs (for loading GLTF and some math)

# Installation
- Clone repo
- $ npm install
- $ vite run dev
- Open the localhost at the port that'll appear on the console.

# Architecture
- A scene graph of game objects.
- Each game object can have components. All game objects have at least one component, the transform components.
- GameObjects have parent-child relationships between them.
- A special kind of Component, Behavior, has callbacks that can be implemented to be executed during the lifecycle of the app (for now only Start and Update) 

# Features
- Editor:
  - Creates new game objects, rename, reparent, change transforms.
  - Change resolution between 800x600 and 1024x768
  - Toggles game object icons on/off
- Renderer:
  - A main render pass that draws the objects.
  - An icon pass to draw the icons
  - GPU Picking with a gpu picker pass. 
