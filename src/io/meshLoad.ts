import { GltfLoader } from 'gltf-loader-ts';
///Loads a mesh into a vertex buffer and index buffer. 
export async function loadMesh(device: GPUDevice, path: string) {
    const loader = new GltfLoader();
    const asset = await loader.load(path);
    
    // Get the first primitive from our Suzanne mesh
    const primitive = asset.gltf.meshes[0].primitives[0];
    
    // In GLTF, primitive.attributes contains mappings like:
    // { POSITION: <accessor>, NORMAL: <accessor>, TEXCOORD_0: <accessor> }
    // We'll use these accessors to get the actual vertex data
    
    // Let's examine what attributes are available
    console.log('Available attributes:', primitive.attributes);
    
    // First, let's get the vertex data from the accessors
    // In GLTF, accessors point to specific regions in the buffer views
    const positionData = await asset.accessorData(primitive.attributes.POSITION);
    const normalData = await asset.accessorData(primitive.attributes.NORMAL);
    const uvData = await asset.accessorData(primitive.attributes.TEXCOORD_0);
    
    // This gives us typed arrays containing our attribute data
    console.log('Position data length:', positionData.length / 3, 'vertices');
    
    // Now we'll create an interleaved vertex buffer for better performance
    // Each vertex will contain: position (3 floats) + normal (3 floats) + uv (2 floats)
    const vertexCount = positionData.length / 3; // Each position has x, y, z
    const stride = 8; // 3 (position) + 3 (normal) + 2 (uv) components per vertex
    const vertexData = new Float32Array(vertexCount * stride);
    
    // Interleave the vertex data
    for (let i = 0; i < vertexCount; i++) {
        // Copy position (xyz)
        vertexData[i * stride + 0] = positionData[i * 3 + 0]; // x
        vertexData[i * stride + 1] = positionData[i * 3 + 1]; // y
        vertexData[i * stride + 2] = positionData[i * 3 + 2]; // z
        
        // Copy normal (xyz)
        vertexData[i * stride + 3] = normalData[i * 3 + 0];
        vertexData[i * stride + 4] = normalData[i * 3 + 1];
        vertexData[i * stride + 5] = normalData[i * 3 + 2];
        
        // Copy UV (xy)
        vertexData[i * stride + 6] = uvData[i * 2 + 0];
        vertexData[i * stride + 7] = uvData[i * 2 + 1];
    }
    
    // Create and fill the vertex buffer
    const vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        // Unlike Vulkan, we don't need to explicitly manage memory
        // WebGPU handles the memory allocation for us
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexData);
    
    // Now handle the index buffer
    // In GLTF, primitive.indices points to an accessor for the index data
    const indexData = await asset.accessorData(primitive.indices);
    
    const indexBuffer = device.createBuffer({
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indexData);
    
    // Define how our vertex buffer should be interpreted by the pipeline
    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: stride * Float32Array.BYTES_PER_ELEMENT, // Total bytes per vertex
        attributes: [
            {
                // Position attribute - like layout(location = 0) in GLSL
                format: 'float32x3', // Similar to VK_FORMAT_R32G32B32_SFLOAT
                offset: 0,
                shaderLocation: 0,
            },
            {
                // Normal attribute
                format: 'float32x3',
                offset: 3 * Float32Array.BYTES_PER_ELEMENT,
                shaderLocation: 1,
            },
            {
                // UV attribute
                format: 'float32x2',
                offset: 6 * Float32Array.BYTES_PER_ELEMENT,
                shaderLocation: 2,
            }
        ],
    };
    
    return {
        vertexBuffer,
        indexBuffer,
        vertexBufferLayout,
        vertexCount,
        indexCount: indexData.length,
    };
}