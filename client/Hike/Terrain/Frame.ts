import { mat4, vec3 } from 'gl-matrix';
import { degToRad } from '../../utilities';
import PhotoShader from './Shaders/PhotoShader';

type Data = {
  points: number[],
  indices: number[],
}

type Transform = {
  transform: 'rotateX' | 'rotateY' | 'rotateZ' | 'translate',
  degrees?: number,
  vector?: [number, number, number],
}

class Frame {
  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null = null;

  shader: PhotoShader;

  data: Data | null = null;

  texture: WebGLTexture | null = null;

  xOffset: number;

  yOffset: number;

  zOffset: number;

  transforms: Transform[];

  constructor(
    gl: WebGL2RenderingContext,
    shader: PhotoShader,
    photoUrl: string,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    transforms: Transform[],
  ) {
    this.gl = gl;
    this.shader = shader;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.zOffset = zOffset;
    this.transforms = transforms;

    this.loadPhoto(photoUrl);
  }

  // eslint-disable-next-line class-methods-use-this
  initData(width: number, height: number): Data {
    const scale = 0.0078125;
    const w = (width * scale) / 2;
    const h = (height * scale) / 2;

    const points = [
      -w, 0, h, 0, 0,
      -w, 0, -h, 0, 1,
      w, 0, -h, 1, 1,
      w, 0, h, 1, 0,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
    ];

    const transform = mat4.create();

    mat4.translate(transform, transform, [this.xOffset, this.yOffset, this.zOffset]);

    this.transforms.forEach((t) => {
      switch (t.transform) {
        case 'rotateX':
          mat4.rotateX(transform, transform, degToRad(t.degrees ?? 0));
          break;

        case 'rotateY':
          mat4.rotateY(transform, transform, degToRad(t.degrees ?? 0));
          break;

        case 'rotateZ':
          mat4.rotateZ(transform, transform, degToRad(t.degrees ?? 0));
          break;

        case 'translate':
          mat4.translate(transform, transform, t.vector ?? [0, 0, 0]);
          break;

        default:
          break;
      }
    });

    for (let i = 0; i < points.length; i += 5) {
      const point = vec3.fromValues(points[i + 0], points[i + 1], points[i + 2]);
      vec3.transformMat4(point, point, transform);
      [points[i + 0], points[i + 1], points[i + 2]] = point;
    }

    return { points, indices };
  }

  initBuffers(): void {
    if (this.data === null) {
      throw new Error('data is null');
    }

    this.createVertexBuffer(this.data.points);
    this.createIndexBuffer(this.data.indices);
  }

  createVertexBuffer(
    positions: number[],
  ): void {
    const positionBuffer = this.gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    if (this.shader.attribLocations.vertexPosition === null) {
      throw new Error('vertexPosition is null');
    }

    const floatSize = 4;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(this.shader.attribLocations.vertexPosition);
    this.gl.vertexAttribPointer(
      this.shader.attribLocations.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      5 * floatSize, // stride
      0, // offset
    );

    if (this.shader.attribLocations.texCoord === null) {
      throw new Error('this.shared.attribLocations.texCoord is null');
    }

    this.gl.enableVertexAttribArray(this.shader.attribLocations.texCoord);
    this.gl.vertexAttribPointer(
      this.shader.attribLocations.texCoord,
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

  loadPhoto(photoUrl: string): void {
    const image = new Image();

    if (this.texture === null) {
      image.onload = () => {
        if (this === null || this.gl === null) {
          throw new Error('this or this.gl is null');
        }

        this.data = this.initData(image.width, image.height);

        this.vao = this.gl.createVertexArray();

        this.gl.bindVertexArray(this.vao);
        this.initBuffers();
        this.initTexture(image);
        this.gl.bindVertexArray(null);
      };

      image.src = photoUrl;
    }
  }

  draw(): void {
    if (this.data && this.data.indices.length !== 0) {
      this.gl.bindVertexArray(this.vao);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.data.indices.length, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );
    }
  }
}

export default Frame;
