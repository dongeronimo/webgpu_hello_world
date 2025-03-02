import { mat4, quat, vec3 } from "gl-matrix";

export function Deg2Rad(deg:number):number{
   return deg * 0.01745329; 
}

// Function to create a quaternion that makes an object face in a direction
export function getRotationToDirection(direction: vec3, up: vec3 = vec3.fromValues(0, 1, 0)): quat {
   // Normalize the direction vector
   const normalizedDirection = vec3.create();
   vec3.normalize(normalizedDirection, direction);
   
   // Create a look-at matrix
   const lookAtMatrix = mat4.create();
   const eye = vec3.fromValues(0, 0, 0);
   const target = vec3.create();
   vec3.add(target, eye, normalizedDirection);
   mat4.lookAt(lookAtMatrix, eye, target, up);
   
   // Extract and invert rotation (because lookAt creates a view matrix)
   const rotation = quat.create();
   mat4.getRotation(rotation, lookAtMatrix);
   quat.invert(rotation, rotation);
   
   return rotation;
 }