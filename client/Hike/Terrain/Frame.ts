import { mat4, vec3, vec4 } from 'gl-matrix';
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
  id: number;

  gl: WebGL2RenderingContext;

  vao: WebGLVertexArrayObject | null = null;

  shader: PhotoShader;

  data: Data | null = null;

  texture: WebGLTexture | null = null;

  xOffset: number;

  yOffset: number;

  zOffset: number;

  xRotation = 0;

  yRotation = 0;

  zRotation = 0;

  translation = vec3.create()

  transforms: Transform[] = [];

  transform = mat4.create();

  center: vec3 = vec3.fromValues(0, 0, 0);

  onPhotoLoaded: ((frame: Frame) => void) | null = null;

  constructor(
    id: number,
    gl: WebGL2RenderingContext,
    shader: PhotoShader,
    photoUrl: string,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    transforms: Transform[],
    onPhotoLoaded: (frame: Frame) => void,
  ) {
    this.id = id;
    this.gl = gl;
    this.shader = shader;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.zOffset = zOffset;

    if (transforms) {
      this.transforms = transforms;
    }
    else {
      this.transforms = [
        {
          transform: 'translate',
          vector: [20, 0, 0],
        },
      ];
    }

    this.onPhotoLoaded = onPhotoLoaded;

    this.loadPhoto(photoUrl);
  }

  // eslint-disable-next-line class-methods-use-this
  initData(width: number, height: number): Data {
    // const scale = 0.0078125;
    const w = 31.5 / 2; // (width * scale) / 2;
    const h = 23.625 / 2; // (height * scale) / 2;

    console.log(`width, height: ${width}, ${height}; w, h: ${w}, ${h}`);

    const points = [
      0, w, h, 0, 0,
      0, w, -h, 0, 1,
      0, -w, -h, 1, 1,
      0, -w, h, 1, 0,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
    ];

    this.transforms.forEach((t) => {
      switch (t.transform) {
        case 'rotateX':
          this.xRotation = t.degrees ?? 0;
          break;

        case 'rotateY':
          this.yRotation = t.degrees ?? 0;
          break;

        case 'rotateZ':
          this.zRotation = t.degrees ?? 0;
          break;

        case 'translate':
          this.translation = t.vector ?? vec3.fromValues(0, 0, 0);
          break;

        default:
          break;
      }
    });

    this.makeTransform();

    return { points, indices };
  }

  makeTransform(): void {
    const transform = mat4.create();

    mat4.translate(transform, transform, [this.xOffset, this.yOffset, this.zOffset]);

    mat4.rotateZ(transform, transform, degToRad(this.zRotation));
    mat4.rotateY(transform, transform, degToRad(this.yRotation));
    mat4.translate(transform, transform, this.translation);
    mat4.rotateX(transform, transform, degToRad(this.xRotation));

    this.transform = transform;

    vec3.transformMat4(this.center, this.center, this.transform);
  }

  setTranslation(x: number | null, y: number | null, z: number | null): void {
    if (x !== null) {
      this.translation[0] = x;
    }

    if (y !== null) {
      this.translation[1] = y;
    }

    if (z !== null) {
      this.translation[2] = z;
    }

    this.makeTransform();
  }

  setRotation(x: number | null, y: number | null, z: number | null): void {
    if (x !== null) {
      this.xRotation = x;
    }

    if (y !== null) {
      this.yRotation = y;
    }

    if (z !== null) {
      this.zRotation = z;
    }

    this.makeTransform();
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

        if (this.onPhotoLoaded) {
          this.onPhotoLoaded(this);
        }
      };

      image.src = photoUrl;
    }
  }

  draw(): void {
    if (this.data && this.data.indices.length !== 0) {
      this.gl.bindVertexArray(this.vao);

      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

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
