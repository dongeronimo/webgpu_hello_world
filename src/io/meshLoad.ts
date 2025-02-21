import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export async function loadMesh(device: GPUDevice, path: string) {
  // Create a promise that will resolve when the model is loaded
  return new Promise<{
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    vertexBufferLayout: GPUVertexBufferLayout;
    vertexCount: number;
    indexCount: number;
    indexFormat: 'uint16' | 'uint32';
  }>((resolve, reject) => {
    const loader = new GLTFLoader();
    
    loader.load(
      path,
      (gltf) => {
        // Get the first mesh from the scene
        const mesh = gltf.scene.children.find(child => child.type === 'Mesh') as THREE.Mesh;
        
        if (!mesh) {
          reject(new Error('No mesh found in the GLTF file'));
          return;
        }
        
        // Get the geometry from the mesh
        const geometry = mesh.geometry;
        
        // Get position attribute
        const positionAttribute = geometry.getAttribute('position');
        const positions = positionAttribute.array;
        
        // Get normal attribute
        const normalAttribute = geometry.getAttribute('normal');
        const normals = normalAttribute.array;
        
        // Get uv attribute (if available)
        let uvs = new Float32Array(positionAttribute.count * 2);
        const uvAttribute = geometry.getAttribute('uv');
        if (uvAttribute) {
          uvs = uvAttribute.array as Float32Array;
        } else {
          // Fill with zeros if UVs aren't available
          for (let i = 0; i < uvs.length; i++) {
            uvs[i] = 0;
          }
        }
        
        // Create an interleaved vertex buffer
        const vertexCount = positionAttribute.count;
        const stride = 8; // 3 (position) + 3 (normal) + 2 (uv)
        const vertexData = new Float32Array(vertexCount * stride);
        
        // Interleave the data for better performance
        for (let i = 0; i < vertexCount; i++) {
          // Position (xyz)
          vertexData[i * stride + 0] = positions[i * 3 + 0];
          vertexData[i * stride + 1] = positions[i * 3 + 1];
          vertexData[i * stride + 2] = positions[i * 3 + 2];
          
          // Normal (xyz)
          vertexData[i * stride + 3] = normals[i * 3 + 0];
          vertexData[i * stride + 4] = normals[i * 3 + 1];
          vertexData[i * stride + 5] = normals[i * 3 + 2];
          
          // UV (xy)
          vertexData[i * stride + 6] = uvs[i * 2 + 0];
          vertexData[i * stride + 7] = uvs[i * 2 + 1];
        }
        
        // Create vertex buffer
        const vertexBuffer = device.createBuffer({
          size: vertexData.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        
        // Copy data to the buffer
        device.queue.writeBuffer(vertexBuffer, 0, vertexData);
        
        // Get and process index data
        let indices: Uint16Array | Uint32Array;
        let indexFormat: 'uint16' | 'uint32' = 'uint16';
        
        if (geometry.index) {
          const originalIndices = geometry.index.array;
          
          // Check if we need to convert to Uint16Array
          if (originalIndices instanceof Uint32Array && vertexCount <= 65535) {
            // We can safely convert to Uint16
            indices = new Uint16Array(originalIndices.length);
            for (let i = 0; i < originalIndices.length; i++) {
              indices[i] = originalIndices[i];
            }
          } else if (originalIndices instanceof Uint32Array) {
            // Keep as Uint32
            indices = originalIndices;
            indexFormat = 'uint32';
          } else {
            // Already Uint16 or other format that can be used as Uint16
            indices = originalIndices as Uint16Array;
          }
          
          console.log('Index data type:', indices.constructor.name);
          console.log('Index count:', indices.length);
        } else {
          // Generate sequential indices if not present
          indices = new Uint16Array(vertexCount);
          for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
          }
        }
        
        // Create index buffer
        const indexBuffer = device.createBuffer({
          size: indices.byteLength,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        
        // Copy data to the buffer
        device.queue.writeBuffer(indexBuffer, 0, indices);
        
        // Define the vertex buffer layout
        const vertexBufferLayout: GPUVertexBufferLayout = {
          arrayStride: stride * Float32Array.BYTES_PER_ELEMENT,
          attributes: [
            {
              // Position
              format: 'float32x3',
              offset: 0,
              shaderLocation: 0,
            },
            {
              // Normal
              format: 'float32x3',
              offset: 3 * Float32Array.BYTES_PER_ELEMENT,
              shaderLocation: 1,
            },
            {
              // UV
              format: 'float32x2',
              offset: 6 * Float32Array.BYTES_PER_ELEMENT,
              shaderLocation: 2,
            }
          ],
        };
        
        resolve({
          vertexBuffer,
          indexBuffer,
          vertexBufferLayout,
          vertexCount,
          indexCount: indices.length,
          indexFormat,
        });
      },
      // Progress callback
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      // Error callback
      (error) => {
        console.error('Error loading GLTF file:', error);
        reject(error);
      }
    );
  });
}