#version 300 es

in highp vec2 vTexCoord;
in highp float vOffset;
in highp float vInverseSlope;

out highp vec4 FragColor;

uniform sampler2D photoTexture;

void main() {
  highp float width = 100.0;
  highp float blendWidth = 100.0;
  highp vec4 color = texture(photoTexture, vTexCoord);
  highp float alpha = 1.0;

  highp float x = (gl_FragCoord.y - vOffset) * vInverseSlope;
  if (gl_FragCoord.x > (x - width) && gl_FragCoord.x < (x + width)) {
    alpha = 0.0;
  }
  else if (gl_FragCoord.x >= (x - width - blendWidth) && gl_FragCoord.x <= (x + width + blendWidth)) {
    if (gl_FragCoord.x <= (x - width)) {
      alpha =  (((x - width) - gl_FragCoord.x) / blendWidth);
    }
    else {
      alpha = (gl_FragCoord.x - (x + width)) / blendWidth;
    }
  } 

  color.a = alpha;

  FragColor = color;
}
