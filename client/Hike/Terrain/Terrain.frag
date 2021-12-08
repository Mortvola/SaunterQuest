#version 300 es
in highp float fLighting;
in highp vec2 vTexCoord;
in highp vec3 vPosition;

out highp vec4 FragColor;

uniform sampler2D terrainTexture;
uniform highp vec4 uFogColor;
uniform highp float uFogNear;
uniform highp float uFogFar;

void main() {
  // if (vTexCoord[0] < 0.0 || vTexCoord[0] > 1.0 || vTexCoord[1] < 0.0 || vTexCoord[1] > 1.0) {
  //   discard;
  // }

  highp vec4 color = mix(
    vec4(0.7, 0.7, 0.7, 1.0), // darken the detail texture a bit.
    vec4(0.3, 0.3, 0.3, 1.0), // Use a low ambient light level.
    fLighting);

  highp float fogDistance = length(vPosition);
  highp float fogAmount = smoothstep(uFogNear, uFogFar, fogDistance);

  FragColor = mix(color, uFogColor, fogAmount);
}
