// Define our uniform buffer structure containing transformation matrices
struct Uniforms {
    modelMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
};

// Bind the uniform buffer to binding 0 of binding group 0
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Vertex shader inputs - these match the locations we defined in our vertex buffer layout
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

// Vertex shader outputs - these will be passed to the fragment shader
struct VertexOutput {
    // The @builtin(position) attribute tells the system this is the clip-space position
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

// Vertex shader
@vertex
fn vertexMain(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    // Calculate the model-view-projection matrix
    let mvpMatrix = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.modelMatrix;
    
    // Transform the vertex position to clip space
    // This is similar to gl_Position = mvp * vec4(position, 1.0) in GLSL
    out.position = mvpMatrix * vec4<f32>(in.position, 1.0);
    
    // Pass through other attributes to the fragment shader
    // We're transforming the normal using only the model matrix for now
    // For completely correct lighting, you'd use the inverse transpose of the model matrix
    out.normal = (uniforms.modelMatrix * vec4<f32>(in.normal, 0.0)).xyz;
    out.uv = in.uv;
    
    return out;
}

// Fragment shader
@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    // For now, we'll output a simple color based on the transformed normal
    // This will give a basic lighting effect where surfaces facing different directions
    // have different colors
    
    // Normalize the interpolated normal
    let normal = normalize(in.normal);
    
    // Create a simple light direction (pointing up and toward the camera a bit)
    let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.3));
    
    // Calculate simple diffuse lighting (dot product of normal and light direction)
    // We use max to avoid negative values (when surface faces away from light)
    let diffuse = max(dot(normal, lightDir), 0.0);
    
    // Add ambient lighting so surfaces facing away from light aren't completely black
    let lighting = 0.3 + diffuse * 0.7;
    
    // Base color of the object
    let baseColor = vec3<f32>(0.5, 0.5, 1.0); // A nice blue color
    
    // Apply lighting to the base color
    return vec4<f32>(baseColor * lighting, 1.0);
}