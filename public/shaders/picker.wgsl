// Uniform structures matching the standard pipeline layout but with objectId
struct Uniforms {
    modelMatrix: mat4x4<f32>,
    objectId: vec4<f32>, // Using vec4 for proper alignment, only first component is used
};

struct VPUniforms {
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
};

// Vertex inputs matching the standard vertex layout
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

// Bind groups with the same layout as the standard pipeline
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> vpUniforms: VPUniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    // Combine view, projection, and model matrices
    let mvMatrix = vpUniforms.viewMatrix * uniforms.modelMatrix;
    let mvpMatrix = vpUniforms.projectionMatrix * mvMatrix;
    
    // Transform the vertex position
    output.position = mvpMatrix * vec4<f32>(input.position, 1.0);
    return output;
}

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
    // Get the object ID from the first component of objectId vector
    let id = u32(uniforms.objectId.x);
    
    // Convert object ID to RGBA color
    let r = f32((id >> 0u) & 0xFFu) / 255.0;
    let g = f32((id >> 8u) & 0xFFu) / 255.0;
    let b = f32((id >> 16u) & 0xFFu) / 255.0;
    let a = f32((id >> 24u) & 0xFFu) / 255.0;
    
    return vec4<f32>(r, g, b, a);
}