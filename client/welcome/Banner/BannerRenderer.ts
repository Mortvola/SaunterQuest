import { vec3, mat4 } from 'gl-matrix';
import Shader from './Shaders/Shader';
import Photo from './Photo';
import photoVertex from './Shaders/Photo.vert';
import photoFragment from './Shaders/Photo.frag';
import terrainVertex from './Shaders/Terrain.vert';
import terrainFragment from './Shaders/Terrain.frag';

const requestPostAnimationFrame = (task: (timestamp: number) => void) => {
  requestAnimationFrame((timestamp: number) => {
    setTimeout(() => {
      task(timestamp);
    }, 0);
  });
};

class BannerRenderer {
  gl: WebGL2RenderingContext;

  #render = false;

  previousTimestamp: number | null = null;

  terrain: Photo;

  photo: Photo;

  photoShader: Shader;

  terrainShader: Shader;

  #picturesLoaded = false;

  intercept = 0;

  inverseSlope = -3 / 2;

  maxIntercept = 0;

  delta = 250;

  constructor(
    gl: WebGL2RenderingContext,
    maxHeight: number,
  ) {
    this.gl = gl;

    this.photoShader = new Shader(gl, photoVertex, photoFragment);
    this.terrainShader = new Shader(gl, terrainVertex, terrainFragment);

    this.terrain = new Photo(gl, this.terrainShader, 3);
    this.photo = new Photo(gl, this.photoShader, 2);

    this.loadPictures();
  }

  adjustCanvasHeight(): void {
    // Make sure canvas is no more than a 1/3 of the document height;
    const h = document.documentElement.clientWidth
      * (this.terrain.image.height / this.terrain.image.width);
    const t = document.documentElement.clientHeight * 0.33;
    const p = Math.min(t / h, 1.0);

    this.gl.canvas.width = this.terrain.image.width;
    this.gl.canvas.height = this.terrain.image.height * p;
  }

  async loadPictures(): Promise<void> {
    await Promise.all([
      this.terrain.load('/banner-terrain.png'),
      this.photo.load('/banner-photo.png'),
    ]);

    this.setLineValues();
    this.#picturesLoaded = true;
  }

  setLineValues(): void {
    const slope = -(Math.random() + 1);
    this.inverseSlope = 1 / slope;

    if (slope > 0) {
      this.intercept = -(this.gl.canvas.width + 200) * slope;
      this.maxIntercept = this.gl.canvas.height + 200 * slope;
    }
    else {
      this.intercept = 200 * slope * 20; // The 20 is to give it a bit of delay before seeing it.
      this.maxIntercept = this.gl.canvas.height
        - (this.gl.canvas.width + 200) * slope;
    }

    this.delta = (this.maxIntercept - this.intercept) / 6;
  }

  start(): void {
    const draw = (timestamp: number) => {
      if (this.#render) {
        if (timestamp !== this.previousTimestamp && this.#picturesLoaded) {
          if (this.previousTimestamp !== null) {
            const elapsedTime = (timestamp - this.previousTimestamp) * 0.001;

            this.intercept += this.delta * elapsedTime;
            if (this.intercept >= this.maxIntercept) {
              this.setLineValues();
            }
          }

          this.previousTimestamp = timestamp;

          this.drawScene();
        }

        requestPostAnimationFrame(draw);
      }
    };

    if (!this.#render) {
      requestPostAnimationFrame(draw);
      this.#render = true;
    }
  }

  stop(): void {
    this.#render = false;
  }

  drawScene(): void {
    this.adjustCanvasHeight();

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // this.gl.canvas.width = (this.gl.canvas.clientWidth / this.gl.canvas.clientHeight)
    //   * this.gl.canvas.height;
    const projectionMatrix = this.getProjectionMatrix();
    const viewMatrix = this.getViewMatrix();

    // Clear the canvas before we start drawing on it.
    // eslint-disable-next-line no-bitwise
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.disable(this.gl.BLEND);

    this.drawTerrain(projectionMatrix, viewMatrix);
    this.drawPhoto(projectionMatrix, viewMatrix);
  }

  // eslint-disable-next-line class-methods-use-this
  getProjectionMatrix(): mat4 {
    const zNear = 1;
    const zFar = 4;

    return mat4.ortho(
      mat4.create(),
      -this.terrain.image.width / 2,
      this.terrain.image.width / 2,
      this.terrain.image.height / 2 - this.gl.canvas.height,
      this.terrain.image.height / 2,
      zNear,
      zFar,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getViewMatrix(): mat4 {
    const cameraOffset = vec3.create();
    const cameraFront = vec3.fromValues(0, 0, 1);

    const cameraTarget = vec3.add(vec3.create(), cameraOffset, cameraFront);

    const cameraUp = vec3.fromValues(0, 1, 0);

    return mat4.lookAt(mat4.create(), cameraOffset, cameraTarget, cameraUp);
  }

  drawTerrain(
    projectionMatrix: mat4,
    viewMatrix: mat4,
  ): void {
    this.gl.useProgram(this.terrainShader.shaderProgram);

    this.gl.uniformMatrix4fv(
      this.terrainShader.projectionMatrix,
      false,
      projectionMatrix,
    );

    this.gl.uniformMatrix4fv(
      this.terrainShader.viewMatrix,
      false,
      viewMatrix,
    );

    this.gl.disable(this.gl.BLEND);

    this.gl.uniformMatrix4fv(
      this.terrainShader.modelMatrix,
      false,
      mat4.create(),
    );

    this.terrain.draw();
  }

  drawPhoto(
    projectionMatrix: mat4,
    viewMatrix: mat4,
  ): void {
    this.gl.useProgram(this.photoShader.shaderProgram);

    this.gl.uniformMatrix4fv(
      this.photoShader.projectionMatrix,
      false,
      projectionMatrix,
    );

    this.gl.uniformMatrix4fv(
      this.photoShader.viewMatrix,
      false,
      viewMatrix,
    );

    this.gl.blendColor(0, 0, 0, 1);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);

    this.gl.uniformMatrix4fv(
      this.photoShader.modelMatrix,
      false,
      mat4.create(),
    );

    this.photoShader.setUniform('uOffset', this.intercept);
    this.photoShader.setUniform('uInverseSlope', this.inverseSlope);

    this.photo.draw();
  }
}

export default BannerRenderer;
