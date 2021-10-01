#version 300 es
in highp float fLighting;
in highp vec2 vTexCoord;

out highp vec4 FragColor;

uniform sampler2D terrainTexture;

void main() {
  FragColor = mix(texture(terrainTexture, vTexCoord), vec4(0.0, 0.0, 0.0, 1.0), fLighting);
}
