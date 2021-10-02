import { vec3, mat4 } from 'gl-matrix';
import { haversineGreatCircleDistance } from '../utilities';
import { Points } from '../ResponseTypes';
import { compileProgram, getStartOffset, loadShader } from './TerrainCommon';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';

export type TerrainBuffers = {
  position: WebGLBuffer,
  indices: WebGLBuffer,
  numVertices: number,
  normals: WebGLBuffer,
}

type Location = { x: number, y: number, zoom: number };

const terrainVertexStride = 5;

class TerrainTile {
  gl: WebGL2RenderingContext;

  texture: WebGLTexture | null = null;

  buffers: TerrainBuffers | null = null;

  shaderProgram: WebGLProgram | null = null;

  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null,
    modelViewMatrix: WebGLUniformLocation | null,
  } = { projectionMatrix: null, modelViewMatrix: null };

  attribLocations: {
    vertexPosition: number | null,
    texCoord: number | null,
    vertexNormal: number | null,
  } = { vertexPosition: null, texCoord: null, vertexNormal: null }

  constructor(
    gl: WebGL2RenderingContext,
    location: Location,
    tileServerUrl: string,
    pathFinderUrl: string,
  ) {
    this.gl = gl;

    this.initTerrainProgram();

    this.loadTerrain(tileServerUrl, pathFinderUrl, location);
  }

  async loadTerrain(
    tileServerUrl: string,
    pathFinderUrl: string,
    location: Location,
  ): Promise<void> {
    const response = await fetch(`${pathFinderUrl}/elevation/tile/${location.zoom}/${location.x}/${location.y}`, {
      headers: {
        'access-control-allow-origins': '*',
      },
    });

    if (response.ok) {
      const body = await response.json();
      const terrain: Points = body;
      if (terrain !== null) {
        this.initBuffers(terrain);
        this.initTexture(tileServerUrl, location);
      }
    }
    else {
      throw new Error('invalid response');
    }
  }

  initBuffers(
    terrain: Points,
  ): void {
    const numPointsX = terrain.points[0].length;
    const numPointsY = terrain.points.length;

    const latDistance = haversineGreatCircleDistance(
      terrain.ne.lat, terrain.sw.lng, terrain.sw.lat, terrain.sw.lng,
    );
    const lngDistance = haversineGreatCircleDistance(
      terrain.sw.lat, terrain.ne.lng, terrain.sw.lat, terrain.sw.lng,
    );

    // console.log(`ne: ${JSON.stringify(terrain.ne)}, sw: ${JSON.stringify(terrain.sw)})`);
    // console.log(`position: ${JSON.stringify(position)}`);

    // const zScale = 1;
    const latStep = latDistance / (numPointsY - 1);
    const lngStep = lngDistance / (numPointsX - 1);

    const { startLatOffset, startLngOffset } = getStartOffset(terrain.sw);

    // console.log(`zscale: ${zScale}, latStep=${latStep}, lngStep=${lngStep}`);
    // console.log(`${-1 * lngStep}, ${1 * latStep} to ${1 * lngStep}, ${-1 * latStep}`);

    const { positionBuffer, positions } = this.createTerrainBuffer(
      terrain, numPointsX, numPointsY, startLatOffset, startLngOffset, latStep, lngStep,
    );
    const { indexBuffer, indices } = this.createIndexBuffer(numPointsX, numPointsY);
    const normalBuffer = this.createNormalBuffer(positions, indices, numPointsX, numPointsY);

    // console.log(`number of positions: ${positions.length}`);
    // console.log(`number of indices: ${indices.length}`);

    // console.log(`min/max elevation: ${min}/${max} ${normalizeEle(min)}/${normalizeEle(max)}`);
    // console.log(`elevation: ${center + 2}, ${normalizeEle(center + 2)}`);

    this.buffers = {
      position: positionBuffer,
      indices: indexBuffer,
      numVertices: indices.length,
      normals: normalBuffer,
    };
  }

  createTerrainBuffer(
    terrain: Points,
    numPointsX: number,
    numPointsY: number,
    startLatOffset: number,
    startLngOffset: number,
    latStep: number,
    lngStep: number,
  ): { positionBuffer: WebGLBuffer, positions: number[] } {
    const positionBuffer = this.gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    const positions = [];

    for (let i = 0; i < numPointsX; i += 1) {
      positions.push(startLngOffset + i * lngStep);
      positions.push(startLatOffset);
      positions.push(terrain.points[0][i]);

      // texture coordinates
      positions.push(i / (numPointsX - 1));
      positions.push(1);
    }

    for (let j = 1; j < numPointsY; j += 1) {
      positions.push(startLngOffset);
      positions.push(startLatOffset + j * latStep);
      positions.push(terrain.points[j][0]);

      // texture coordinates
      positions.push(0);
      positions.push(1 - j / (numPointsY - 1));

      for (let i = 1; i < numPointsX; i += 1) {
        positions.push(startLngOffset + (i - 0.5) * lngStep);
        positions.push(startLatOffset + (j - 0.5) * latStep);
        positions.push(terrain.centers[j - 1][i - 1]);

        // texture coordinates
        positions.push((i - 0.5) / (numPointsX - 1));
        positions.push(1 - (j - 0.5) / (numPointsY - 1));

        positions.push(startLngOffset + i * lngStep);
        positions.push(startLatOffset + j * latStep);
        positions.push(terrain.points[j][i]);

        // texture coordinates
        positions.push(i / (numPointsX - 1));
        positions.push(1 - (j / (numPointsY - 1)));
      }
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    return { positionBuffer, positions };
  }

  createIndexBuffer(
    numPointsX: number,
    numPointsY: number,
  ): { indexBuffer: WebGLBuffer, indices: number[] } {
    const indexBuffer = this.gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error('indexBuffer is null');
    }

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

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);

    return { indexBuffer, indices };
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

  createNormalBuffer(
    positions: number[],
    indices: number[],
    numPointsX: number,
    numPointsY: number,
  ): WebGLBuffer {
    const normalBuffer = this.gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexNormals), this.gl.STATIC_DRAW);

    return normalBuffer;
  }

  drawTerrain(
    projectionMatrix: mat4,
    modelViewMatrix: mat4,
  ): void {
    if (this.buffers !== null) {
      if (this.shaderProgram === null) {
        throw new Error('this.shaderProgram is null');
      }

      if (this.attribLocations.vertexPosition === null) {
        throw new Error('this.attribLocations.vertexPosition is null');
      }

      // Tell WebGL how to pull out the positions from the position
      // buffer into the vertexPosition attribute.
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
      this.gl.vertexAttribPointer(
        this.attribLocations.vertexPosition,
        3, // Number of components
        this.gl.FLOAT,
        false, // normalize
        terrainVertexStride * 4, // stride
        0, // offset
      );
      this.gl.enableVertexAttribArray(
        this.attribLocations.vertexPosition,
      );

      if (this.attribLocations.texCoord === null) {
        throw new Error('this.attribLocations.texCoord is null');
      }

      this.gl.vertexAttribPointer(
        this.attribLocations.texCoord,
        2, // Number of components
        this.gl.FLOAT,
        false, // normalize
        terrainVertexStride * 4, // stride
        3 * 4, // offset
      );
      this.gl.enableVertexAttribArray(
        this.attribLocations.texCoord,
      );

      // Tell WebGL how to pull out the normals from
      // the normal buffer into the vertexNormal attribute.
      if (this.attribLocations.vertexNormal === null) {
        throw new Error('this.attribLocations.vertexNormal is null');
      }

      {
        const numComponents = 3;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normals);
        this.gl.vertexAttribPointer(
          this.attribLocations.vertexNormal,
          numComponents,
          type,
          normalize,
          stride,
          offset,
        );
        this.gl.enableVertexAttribArray(
          this.attribLocations.vertexNormal,
        );
      }

      // Tell WebGL which indices to use to index the vertices
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

      // Tell WebGL to use our program when drawing

      this.gl.useProgram(this.shaderProgram);

      // Set the shader uniforms

      this.gl.uniformMatrix4fv(
        this.uniformLocations.projectionMatrix,
        false,
        projectionMatrix,
      );

      this.gl.uniformMatrix4fv(
        this.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix,
      );

      this.gl.uniform1i(this.gl.getUniformLocation(this.shaderProgram, 'terrainTexture'), 0);

      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

      {
        const vertexCount = this.buffers.numVertices;
        const type = this.gl.UNSIGNED_INT;
        const offset = 0;
        this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
      }
    }
  }

  initTexture(tileServerUrl: string, location: Location): void {
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
      image.src = `${tileServerUrl}/tile/detail/${location.zoom}/${location.x}/${location.y}`;
    }
  }

  initTerrainProgram(): void {
    const vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, terrainVertex);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, terrainFragment);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    this.shaderProgram = compileProgram(this.gl, vertexShader, fragmentShader);

    if (this.shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    this.uniformLocations.projectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');

    if (this.uniformLocations.projectionMatrix === null) {
      throw new Error('projectionMatrix is null');
    }

    this.uniformLocations.modelViewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix');

    if (this.uniformLocations.modelViewMatrix === null) {
      throw new Error('modelViewMatrix is null');
    }

    this.attribLocations.vertexPosition = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.attribLocations.texCoord = this.gl.getAttribLocation(this.shaderProgram, 'aTexCoord');
    this.attribLocations.vertexNormal = this.gl.getAttribLocation(this.shaderProgram, 'aVertexNormal');
  }
}

export default TerrainTile;
