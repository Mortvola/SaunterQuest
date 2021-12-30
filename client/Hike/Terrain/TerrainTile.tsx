import { mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import L from 'leaflet';
import {
  bilinearInterpolation, latDistance, latOffset, terrainTileToLatLng,
} from '../../utilities';
import { PhotoProps, Points } from '../../../common/ResponseTypes';
import Shader from './Shaders/TerrainShader';
import Frame from './Frame';
import PhotoShader from './Shaders/PhotoShader';

type TerrainData = {
  elevation: number[][],
  points: number[],
  indices: number[],
  normals: number[],
  dimension: number,
}

type Location = { x: number, y: number, zoom: number };

const locationKey = (location: Location): string => (
  `${location.zoom}-${location.x}-${location.y}`
);

const terrainDataMap: Map<string, TerrainData> = new Map();

const terrainVertexStride = 5;

export interface TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  pathFinderUrl: string;
}

class TerrainTile {
  location: Location;

  static dimension = latDistance(-104, -103) / (2 ** 4);

  renderer: TerrainRendererInterface;

  vao: WebGLVertexArrayObject | null;

  gl: WebGL2RenderingContext;

  texture: WebGLTexture | null = null;

  numIndices = 0;

  frames: Frame[] = [];

  photoShader: PhotoShader;

  photoUrl: string;

  elevation: number[][] = [];

  sw: L.LatLng;

  ne: L.LatLng;

  latLngCenter: L.LatLng;

  onPhotoLoaded: (frame: Frame) => void;

  constructor(
    renderer: TerrainRendererInterface,
    photoUrl: string,
    location: Location,
    photoShader: PhotoShader,
    onPhotoLoaded: (frame: Frame) => void,
  ) {
    this.location = location;
    this.renderer = renderer;
    this.gl = renderer.gl;
    this.photoShader = photoShader;
    this.photoUrl = photoUrl;
    this.onPhotoLoaded = onPhotoLoaded;

    this.latLngCenter = terrainTileToLatLng(
      this.location.x, this.location.y, this.location.zoom,
    );

    const zoomFactor = 2 ** this.location.zoom;

    const latlngDimension = 1 / zoomFactor;
    const halfDimension = latlngDimension / 2;

    this.sw = new L.LatLng(
      this.latLngCenter.lat - halfDimension,
      this.latLngCenter.lng - halfDimension,
    );

    this.ne = new L.LatLng(
      this.latLngCenter.lat + halfDimension,
      this.latLngCenter.lng + halfDimension,
    );

    this.vao = this.gl.createVertexArray();
  }

  async load(shader: Shader, onTileLoaded: () => void): Promise<void | void[]> {
    let data = terrainDataMap.get(locationKey(this.location));

    if (!data) {
      const response = await Http.get<Points>(`${this.renderer.pathFinderUrl}/elevation/tile/${this.location.zoom}/${this.location.x}/${this.location.y}`);

      if (response.ok) {
        const body = await response.body();

        data = {
          elevation: body.ele,
          points: body.points,
          indices: body.indices,
          normals: body.normals,
          dimension: TerrainTile.dimension,
        };

        terrainDataMap.set(locationKey(this.location), data);
      }
      else {
        throw new Error('invalid response');
      }
    }

    const handlePhotosLoaded = () => {
      onTileLoaded();
    };

    if (data) {
      this.elevation = data.elevation;
      this.initBuffers(data, shader);
      return this.loadPhotos(handlePhotosLoaded);
    }

    return Promise.resolve();
  }

  getElevation(x: number, y: number): number {
    const pointX = (x / TerrainTile.dimension + 0.5) * (this.elevation[0].length - 1);
    const pointY = (y / TerrainTile.dimension + 0.5) * (this.elevation.length - 1);

    const x1 = Math.floor(pointX);
    const y1 = Math.floor(pointY);

    const x2 = pointX - x1;
    const y2 = pointY - y1;

    return bilinearInterpolation(
      this.elevation[y1][x1],
      this.elevation[y1][x1 + 1],
      this.elevation[y1 + 1][x1],
      this.elevation[y1 + 1][x1 + 1],
      x2,
      y2,
    );
  }

  async loadPhotos(onPhotosLoaded: () => void): Promise<void | void[]> {
    const response = await Http.get<PhotoProps[]>(`/api/poi/photos?n=${this.ne.lat}&s=${this.sw.lat}&e=${this.ne.lng}&w=${this.sw.lng}`);

    if (response.ok) {
      const body = await response.body();
      if (body.length === 0) {
        onPhotosLoaded();

        return Promise.resolve();
      }

      let photosLoaded = 0;

      const handlePhotoLoaded = (frame: Frame) => {
        this.onPhotoLoaded(frame);

        photosLoaded += 1;
        if (photosLoaded >= body.length) {
          onPhotosLoaded();
        }
      };

      return Promise.all(body.map(async (p) => {
        const xOffset = -latOffset(p.location[0], this.latLngCenter.lng);
        const yOffset = -latOffset(p.location[1], this.latLngCenter.lat);
        const zOffset = this.getElevation(xOffset, yOffset) + 2;
        const frame = new Frame(
          p.id,
          this.gl,
          this.photoShader,
          xOffset,
          yOffset,
          zOffset,
          p.transforms,
          handlePhotoLoaded,
        );

        this.frames.push(frame);

        return frame.loadPhoto(`${this.photoUrl}/${p.id}`);
      }));
    }

    return Promise.resolve();
  }

  initBuffers(
    data: TerrainData,
    shader: Shader,
  ): void {
    this.gl.bindVertexArray(this.vao);
    this.createVertexBuffer(data.points, shader);
    this.createIndexBuffer(data.indices);
    this.createNormalBuffer(data.normals, shader);
    this.gl.bindVertexArray(null);

    this.numIndices = data.indices.length;
  }

  createVertexBuffer(
    positions: number[],
    shader: Shader,
  ): void {
    const vertexBuffer = this.gl.createBuffer();

    if (vertexBuffer === null) {
      throw new Error('vertexBuffer is null');
    }

    if (shader.attribLocations.vertexPosition === null) {
      throw new Error('this.attribLocations.vertexPosition is null');
    }

    if (shader.attribLocations.vertexPosition === null) {
      throw new Error('vertexPosition is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexPosition,
      3, // Number of components
      this.gl.FLOAT,
      false, // normalize
      terrainVertexStride * 4, // stride
      0, // offset
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

  createNormalBuffer(
    vertexNormals: number[],
    shader: Shader,
  ): void {
    const normalBuffer = this.gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

    // Tell WebGL how to pull out the normals from
    // the normal buffer into the vertexNormal attribute.
    if (shader.attribLocations.vertexNormal === null) {
      throw new Error('this.attribLocations.vertexNormal is null');
    }

    if (shader.attribLocations.vertexNormal === null) {
      throw new Error('vertexNormal is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);
    this.gl.vertexAttribPointer(
      shader.attribLocations.vertexNormal,
      3, // Number of components
      this.gl.FLOAT, // type
      false, // normalize
      0, // stride
      0, // offset
    );
  }

  draw(
    projectionMatrix: mat4,
    viewMatrix: mat4,
    modelMatrix: mat4,
    shader: Shader,
  ): void {
    if (this.numIndices !== 0) {
      this.gl.uniformMatrix4fv(
        shader.uniformLocations.modelMatrix,
        false,
        modelMatrix,
      );

      this.gl.bindVertexArray(this.vao);

      this.gl.drawElements(
        this.gl.TRIANGLES,
        this.numIndices, // vertex count
        this.gl.UNSIGNED_INT, // unsigned int
        0, // offset
      );
    }
  }

  drawTransparent(
    projectionMatrix: mat4,
    viewMatrix: mat4,
    modelMatrix: mat4,
    shader: Shader,
  ): void {
    if (this.numIndices !== 0) {
      if (this.frames.length > 0) {
        this.gl.useProgram(this.photoShader.shaderProgram);

        this.gl.uniformMatrix4fv(
          this.photoShader.uniformLocations.projectionMatrix,
          false,
          projectionMatrix,
        );

        this.gl.uniformMatrix4fv(
          this.photoShader.uniformLocations.viewMatrix,
          false,
          viewMatrix,
        );

        this.gl.blendColor(1, 1, 1, 0.5);
        this.gl.blendFunc(this.gl.CONSTANT_ALPHA, this.gl.ONE_MINUS_CONSTANT_ALPHA);
        this.gl.enable(this.gl.BLEND);

        this.frames.forEach((f) => {
          this.gl.uniformMatrix4fv(
            this.photoShader.uniformLocations.modelMatrix,
            false,
            f.transform,
          );

          f.draw();
        });

        this.gl.disable(this.gl.BLEND);
      }
    }
  }
}

export default TerrainTile;
