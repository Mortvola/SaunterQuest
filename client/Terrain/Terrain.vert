#version 300 es
in vec4 aVertexPosition;
in vec2 aTexCoord;
in vec3 aVertexNormal;

uniform highp mat4 uModelViewMatrix;
uniform highp mat4 uProjectionMatrix;

out highp float fLighting;
out highp vec2 vTexCoord;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  highp vec4 directionalVector = normalize(vec4(0, -1, -1, 1.0));
  highp vec4 transformedNormal = vec4(aVertexNormal, 1.0);

  fLighting = 1.0 + min(dot(transformedNormal.xyz, directionalVector.xyz), 0.0);
  vTexCoord = aTexCoord;
}
