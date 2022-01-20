import Shader from './Shaders/Shader';

class Photo {
  texture: WebGLTexture | null = null;

  z: number;

  image = new Image();

  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null = null;

  shader: Shader;

  indexCount = 0;

  constructor(
    gl: WebGL2RenderingContext,
    shader: Shader,
    z: number,
  ) {
    this.gl = gl;
    this.shader = shader;
    this.z = z;
  }

  async load(photoUrl: string): Promise<void> {
    if (this.texture === null) {
      return new Promise((resolve) => {
        this.image.onload = () => {
          if (this === null || this.gl === null) {
            throw new Error('this or this.gl is null');
          }

          this.vao = this.gl.createVertexArray();

          this.gl.bindVertexArray(this.vao);
          this.initBuffers(this.image.width, this.image.height);
          this.initTexture(this.image);
          this.gl.bindVertexArray(null);

          resolve();
        };

        this.image.src = photoUrl;
      });
    }

    return Promise.resolve();
  }

  // eslint-disable-next-line class-methods-use-this
  initData(width: number, height: number): { points: number[], indices: number[] } {
    const w = width / 2;
    const h = height / 2;

    const points = [
      w, h, this.z, 0, 0,
      w, -h, this.z, 0, 1,
      -w, -h, this.z, 1, 1,
      -w, h, this.z, 1, 0,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
    ];

    return { points, indices };
  }

  initBuffers(width: number, height: number): void {
    const data = this.initData(width, height);

    this.createVertexBuffer(data.points);
    this.createIndexBuffer(data.indices);

    this.indexCount = data.indices.length;
  }

  createVertexBuffer(
    positions: number[],
  ): void {
    const positionBuffer = this.gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    if (this.shader.vertexPosition === null) {
      throw new Error('vertexPosition is null');
    }

    const floatSize = 4;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(this.shader.vertexPosition);
    this.gl.vertexAttribPointer(
      this.shader.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      5 * floatSize, // stride
      0, // offset
    );

    if (this.shader.texCoord === null) {
      throw new Error('this.shared.attribLocations.texCoord is null');
    }

    this.gl.enableVertexAttribArray(this.shader.texCoord);
    this.gl.vertexAttribPointer(
      this.shader.texCoord,
      2, // Number of components
      this.gl.FLOAT,
      false, // normalize
      5 * floatSize, // stride
      3 * floatSize, // offset
    );
  }

  createIndexBuffer(
    indices: number[],
  ): void {
    const indexBuffer = this.gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error('indexBuffer is null');
    }

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
  }

  initTexture(image: HTMLImageElement):void {
    this.texture = this.gl.createTexture();
    if (this.texture === null) {
      throw new Error('this.texture is null');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    const level = 0;
    const internalFormat = this.gl.RGBA;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      level,
      internalFormat,
      image.width,
      image.height,
      0,
      srcFormat,
      srcType,
      image,
    );
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
  }

  draw(): void {
    if (this.vao) {
      this.gl.bindVertexArray(this.vao);

      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.indexCount, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );
    }
  }
}

export default Photo;
