#version 300 es

in vec4 aVertexPosition;
in vec2 aTexCoord;

uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp float uOffset;
uniform highp float uInverseSlope;

out highp vec2 vTexCoord;
out highp float vOffset;
out highp float vInverseSlope;

void main() {
  highp vec4 position = uViewMatrix * uModelMatrix * aVertexPosition;

  gl_Position = uProjectionMatrix * position;
  vTexCoord = aTexCoord;
  vOffset = uOffset;
  vInverseSlope = uInverseSlope;
}
