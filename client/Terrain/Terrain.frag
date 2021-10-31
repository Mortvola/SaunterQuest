#version 300 es
in highp float fLighting;
in highp vec2 vTexCoord;

out highp vec4 FragColor;

uniform sampler2D terrainTexture;

void main() {
  if (vTexCoord[0] < 0.0 || vTexCoord[0] > 1.0 || vTexCoord[1] < 0.0 || vTexCoord[1] > 1.0) {
    discard;
  }

  FragColor = mix(
    texture(terrainTexture, vTexCoord) * vec4(0.7, 0.7, 0.7, 1.0), // darken the detail texture a bit.
    vec4(0.3, 0.3, 0.3, 1.0), // Use a low ambient light level.
    fLighting);
}
