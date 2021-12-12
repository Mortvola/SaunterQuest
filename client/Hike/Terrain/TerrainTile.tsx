import { vec3, mat4 } from 'gl-matrix';
import Http from '@mortvola/http';
import { latDistance } from '../../utilities';
import { isPointsResponse, Points } from '../../../common/ResponseTypes';
import Shader from './Shader';

type TerrainData = {
  points: number[],
  indices: number[],
  normals: number[],
  xLength: number,
  yLength: number,
}

type Location = { x: number, y: number, zoom: number };

const locationKey = (location: Location): string => (
  `${location.zoom}-${location.x}-${location.y}`
);

const terrainDataMap: Map<string, TerrainData> = new Map();

const terrainVertexStride = 5;

export interface TerrainRendererInterface {
  gl: WebGL2RenderingContext;

  tileServerUrl: string;

  pathFinderUrl: string;
}

class TerrainTile {
  location: Location;

  xLength = 0;

  yLength = 0;

  renderer: TerrainRendererInterface;

  vao: WebGLVertexArrayObject | null;

  gl: WebGL2RenderingContext;

  texture: WebGLTexture | null = null;

  numIndices = 0;

  numPointsX = 0;

  numPointsY = 0;

  constructor(
    renderer: TerrainRendererInterface,
    location: Location,
  ) {
    this.location = location;
    this.renderer = renderer;
    this.gl = renderer.gl;

    this.vao = this.gl.createVertexArray();
  }

  async load(shader: Shader, onTileLoaded: () => void): Promise<void> {
    let data = terrainDataMap.get(locationKey(this.location));

    if (!data) {
      const response = await Http.get(`${this.renderer.pathFinderUrl}/elevation/tile/${this.location.zoom}/${this.location.x}/${this.location.y}`);

      if (response.ok) {
        const body = await response.body();
        if (isPointsResponse(body)) {
          const numPointsX = body.points[0].length;
          const numPointsY = body.points.length;

          const { points, xLength, yLength } = TerrainTile.createTerrainPoints(
            body, numPointsX, numPointsY,
          );
          const indices = TerrainTile.createTerrainIndices(numPointsX, numPointsY);
          const normals = TerrainTile.createTerrainNormals(
            points, indices, numPointsX, numPointsY,
          );

          data = {
            points, indices, normals, xLength, yLength,
          };

          terrainDataMap.set(locationKey(this.location), data);
        }
      }
      else {
        throw new Error('invalid response');
      }
    }

    if (data) {
      this.initBuffers(data, shader);
      // this.initTexture(location);
    }

    onTileLoaded();
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

    this.xLength = data.xLength;
    this.yLength = data.yLength;
  }

  createVertexBuffer(
    positions: number[],
    shader: Shader,
  ): void {
    const positionBuffer = this.gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    if (shader.attribLocations.vertexPosition === null) {
      throw new Error('this.attribLocations.vertexPosition is null');
    }

    if (shader.attribLocations.vertexPosition === null) {
      throw new Error('vertexPosition is null');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
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

  static createTerrainPoints(
    terrain: Points,
    numPointsX: number,
    numPointsY: number,
  ): { points: number[], xLength: number, yLength: number } {
    // const { startLatOffset, startLngOffset } = getStartOffset(terrain.sw);

    // Center the tile around the origin.
    // const startLatOffset = -(terrain.ne.lat - terrain.sw.lat) / 2;
    // const startLngOffset = -(terrain.ne.lng - terrain.sw.lng) / 2;

    const sStep = (terrain.textureNE.s - terrain.textureSW.s) / (numPointsX - 1);
    const tStep = (terrain.textureNE.t - terrain.textureSW.t) / (numPointsY - 1);

    const positions = [];

    // we are purposefully using latDistance for both dimensions
    // here to create a square tile (at least for now).
    const yLength = latDistance(-104, -103) / 16.0;
    const yStep = yLength / (numPointsY - 1);
    const startYOffset = -yLength / 2;

    const xLength = yLength;
    const xStep = xLength / (numPointsX - 1);
    const startXOffset = -xLength / 2;

    for (let i = 0; i < numPointsX; i += 1) {
      positions.push(startXOffset + i * xStep);
      positions.push(startYOffset);
      positions.push(terrain.points[0][i]);

      // texture coordinates
      positions.push(terrain.textureSW.s + i * sStep);
      positions.push(terrain.textureSW.t);
    }

    for (let j = 1; j < numPointsY; j += 1) {
      positions.push(startXOffset);
      positions.push(startYOffset + j * yStep);
      positions.push(terrain.points[j][0]);

      // texture coordinates
      positions.push(terrain.textureSW.s);
      positions.push(terrain.textureSW.t + j * tStep);

      for (let i = 1; i < numPointsX; i += 1) {
        positions.push(startXOffset + (i - 0.5) * xStep);
        positions.push(startYOffset + (j - 0.5) * yStep);
        positions.push(terrain.centers[j - 1][i - 1]);

        // texture coordinates
        positions.push(terrain.textureSW.s + (i - 0.5) * sStep);
        positions.push(terrain.textureSW.t + (j - 0.5) * tStep);

        positions.push(startXOffset + i * xStep);
        positions.push(startYOffset + j * yStep);
        positions.push(terrain.points[j][i]);

        // texture coordinates
        positions.push(terrain.textureSW.s + i * sStep);
        positions.push(terrain.textureSW.t + j * tStep);
      }
    }

    return { points: positions, xLength, yLength };
  }

  static createTerrainIndices(
    numPointsX: number,
    numPointsY: number,
  ): number[] {
    const indices = [];

    for (let i = 0; i < numPointsX - 1; i += 1) {
      indices.push(i);
      indices.push(i + 1);
      indices.push(numPointsX + i * 2 + 1); // center

      indices.push(i + 1);
      indices.push(numPointsX + i * 2 + 2);
      indices.push(numPointsX + i * 2 + 1); // center

      indices.push(numPointsX + i * 2 + 2);
      indices.push(numPointsX + i * 2 + 0);
      indices.push(numPointsX + i * 2 + 1); // center

      indices.push(numPointsX + i * 2 + 0);
      indices.push(i);
      indices.push(numPointsX + i * 2 + 1); // center
    }

    const firstRowOffset = numPointsX;
    const numRowPoints = numPointsX * 2 - 1;
    for (let j = 1; j < numPointsY - 1; j += 1) {
      for (let i = 0; i < numPointsX - 1; i += 1) {
        indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 0);
        indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 2);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);

        indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 2);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 2);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);

        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 2);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 0);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);

        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 0);
        indices.push(firstRowOffset + numRowPoints * (j - 1) + i * 2 + 0);
        indices.push(firstRowOffset + numRowPoints * (j + 0) + i * 2 + 1);
      }
    }

    return indices;
  }

  static computeNormal(positions: number[], indices: number[], index: number): vec3 {
    const v1 = vec3.fromValues(
      positions[indices[index + 2] * terrainVertexStride + 0]
        - positions[indices[index + 1] * terrainVertexStride + 0],
      positions[indices[index + 2] * terrainVertexStride + 1]
        - positions[indices[index + 1] * terrainVertexStride + 1],
      positions[indices[index + 2] * terrainVertexStride + 2]
      - positions[indices[index + 1] * terrainVertexStride + 2],
    );

    const v2 = vec3.fromValues(
      positions[indices[index] * terrainVertexStride + 0]
        - positions[indices[index + 1] * terrainVertexStride + 0],
      positions[indices[index] * terrainVertexStride + 1]
        - positions[indices[index + 1] * terrainVertexStride + 1],
      positions[indices[index] * terrainVertexStride + 2]
        - positions[indices[index + 1] * terrainVertexStride + 2],
    );

    const normal = vec3.create();
    vec3.cross(normal, v1, v2);
    vec3.normalize(normal, normal);

    return normal;
  }

  static createTerrainNormals(
    positions: number[],
    indices: number[],
    numPointsX: number,
    numPointsY: number,
  ): number[] {
    // Create a normal for each face

    const faceNormals: vec3[] = [];

    for (let i = 0; i < indices.length; i += 3) {
      faceNormals.push(TerrainTile.computeNormal(positions, indices, i));
    }

    // Sum the face normals that share a vertex

    const vertexNormals: number[] = [];

    const sumNormals = (indexes: number[]) => {
      const vec = [0, 0, 0];
      for (let i = 0; i < indexes.length; i += 1) {
        vec[0] += faceNormals[indexes[i]][0];
        vec[1] += faceNormals[indexes[i]][1];
        vec[2] += faceNormals[indexes[i]][2];
      }

      const normal = vec3.fromValues(vec[0], vec[1], vec[2]);
      vec3.normalize(normal, normal);

      return normal;
    };

    vertexNormals.push(...sumNormals([0, 3]));

    for (let i = 4; i < (numPointsX - 1) * 4; i += 4) {
      vertexNormals.push(...sumNormals([i - 1, i + 3, i + 6, i]));
    }

    vertexNormals.push(...sumNormals([(numPointsX - 1) * 4, (numPointsX - 1) * 4 + 1]));

    for (let j = 1; j < numPointsY - 1; j += 1) {
      vertexNormals.push(...sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + 3,
        (j - 1) * (numPointsX - 1) * 4 + 2,
        (j + 0) * (numPointsX - 1) * 4 + 0,
        (j + 0) * (numPointsX - 1) * 4 + 3,
      ]));

      for (let i = 1; i < numPointsX - 1; i += 1) {
        vertexNormals.push(...sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 1,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 4,
        ]));

        vertexNormals.push(...sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 2,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 4,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 0,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 3,
        ]));
      }

      vertexNormals.push(...sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
      ]));

      vertexNormals.push(...sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
      ]));
    }

    vertexNormals.push(...sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + 3,
    ]));

    for (let i = 1; i < numPointsX - 1; i += 1) {
      vertexNormals.push(...sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 1,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 4,
      ]));

      vertexNormals.push(...sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 2,
      ]));
    }

    vertexNormals.push(...sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
    ]));

    vertexNormals.push(...sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
    ]));

    return vertexNormals;
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

  initTexture(location: Location): void {
    const image = new Image();

    if (this.texture === null) {
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
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = this.gl.RGBA;
      const srcType = this.gl.UNSIGNED_BYTE;

      const pixel = new Uint8Array([255, 255, 255, 255]);
      this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

      image.onload = () => {
        if (this === null || this.gl === null) {
          throw new Error('this or this.gl is null');
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
          this.gl.TEXTURE_2D, level, internalFormat, 256, 256, 0, srcFormat, srcType, image,
        );
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      };

      image.crossOrigin = 'anonymous';
      image.src = `${this.renderer.tileServerUrl}/tile/detail/${location.zoom}/${location.x}/${location.y}`;
    }
  }
}

export default TerrainTile;
