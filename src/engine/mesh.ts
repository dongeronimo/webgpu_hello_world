import { loadMesh } from "../io/meshLoad";

export type Mesh = {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    vertexBufferLayout: GPUVertexBufferLayout;
    vertexCount: number;
    indexCount: number;
};

export async function createMesh(device:GPUDevice, filepath:string):Promise<Mesh> {
    const {
        vertexBuffer,
        indexBuffer,
        vertexBufferLayout,
        vertexCount,
        indexCount
    } = await loadMesh(device, filepath); 

    return {
        vertexBuffer: vertexBuffer,
        indexBuffer: indexBuffer!, // i assume that there will always be an index buffer
        vertexBufferLayout: vertexBufferLayout,
        vertexCount: vertexCount,
        indexCount: indexCount
    };
}