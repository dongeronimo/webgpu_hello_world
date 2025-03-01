struct Uniforms {
    modelMatrix: mat4x4<f32>,
};

struct VPUniforms {
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
};

// First bind group for matrices
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> vpUniforms: VPUniforms;

// Second bind group for textures
@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var diffuseTexture: texture_2d<f32>;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) worldPos: vec3<f32>,
};

@vertex
fn vertexMain(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    
    // Transform the vertex position from model to world space
    let worldPos = uniforms.modelMatrix * vec4<f32>(in.position, 1.0);
    // Transform from world to view to clip space
    out.position = vpUniforms.projectionMatrix * vpUniforms.viewMatrix * worldPos;
    
    // Transform normal to world space (ignoring translation)
    out.normal = normalize((uniforms.modelMatrix * vec4<f32>(in.normal, 0.0)).xyz);
    out.uv = in.uv;
    out.worldPos = worldPos.xyz;
    
    return out;
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    // Sample the texture using the UV coordinates
    let textureColor = textureSample(diffuseTexture, textureSampler, in.uv);
    return vec4<f32>(textureColor.rgb, textureColor.a);
}