import { compileProgram, loadShader } from './Common';

class Shader {
  gl: WebGL2RenderingContext

  projectionMatrix: WebGLUniformLocation | null;

  viewMatrix: WebGLUniformLocation | null;

  modelMatrix: WebGLUniformLocation | null;

  vertexPosition: number | null;

  texCoord: number | null;

  shaderProgram: WebGLProgram;

  constructor(
    gl: WebGL2RenderingContext,
    vertexShader: string,
    fragmentShader: string,
  ) {
    this.gl = gl;

    const vertShader = loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShader);

    if (vertShader === null) {
      throw new Error('vertShader is null');
    }

    const fragShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShader);

    if (fragShader === null) {
      throw new Error('fragShader is null');
    }

    this.shaderProgram = compileProgram(this.gl, vertShader, fragShader);

    if (this.shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    this.projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');

    if (this.projectionMatrix === null) {
      throw new Error('projectionMatrix is null');
    }

    this.viewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uViewMatrix');

    if (this.viewMatrix === null) {
      throw new Error('viewMatrix is null');
    }

    this.modelMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelMatrix');

    if (this.modelMatrix === null) {
      throw new Error('modelMatrix is null');
    }

    this.vertexPosition = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.texCoord = this.gl.getAttribLocation(this.shaderProgram, 'aTexCoord');
  }

  setUniform(name: string, value: number): void {
    const location = this.gl.getUniformLocation(this.shaderProgram, name);

    if (location !== null) {
      this.gl.uniform1f(location, value);
    }
    else {
      console.log('location not found');
    }
  }
}

export default Shader;
