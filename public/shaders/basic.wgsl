struct Uniforms {
    modelMatrix: mat4x4<f32>,
};

struct VPUniforms {
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> vpUniforms: VPUniforms;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn vertexMain(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    // Transform the vertex position from model to world space
    let worldPos = uniforms.modelMatrix * vec4<f32>(in.position, 1.0);
    // Transform from world to view to clip space
    out.position = vpUniforms.projectionMatrix * vpUniforms.viewMatrix * worldPos;
    
    // Transform normal to world space (ignoring translation)
    out.normal = (uniforms.modelMatrix * vec4<f32>(in.normal, 0.0)).xyz;
    out.uv = in.uv;
    
    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    let normal = normalize(in.normal);
    
    // Simple lighting calculation
    let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.3));
    let diffuse = max(dot(normal, lightDir), 0.0);
    let lighting = 0.3 + diffuse * 0.7;
    let baseColor = vec3<f32>(0.5, 0.5, 1.0);
    
    return vec4<f32>(baseColor * lighting, 1.0);
}