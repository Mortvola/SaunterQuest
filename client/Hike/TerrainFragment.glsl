varying highp vec3 vLighting;

void main() {
  highp vec3 color = vec3(1.0, 1.0, 1.0);
  gl_FragColor = vec4(color * vLighting, 1.0);
}
