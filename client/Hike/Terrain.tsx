import React, {
  ReactElement, useCallback, useEffect, useRef,
} from 'react';
import { vec3, mat4 } from 'gl-matrix';
import { haversineGreatCircleDistance } from '../utilities';
import terrainVertex from './Terrain.vert';
import terrainFragment from './Terrain.frag';
import { LatLng } from '../state/Types';

export type Points = {
  ne: { lat: number, lng: number },
  sw: { lat: number, lng: number },
  points: number[][],
  centers: number[][],
};

export type Location = {
  x: number,
  y: number,
  zoom: number,
};

type PropsType = {
  position: LatLng,
  elevation: number,
  terrain: Points,
  tileServerUrl: string,
  location: Location,
}

const Terrain = ({
  position,
  elevation,
  terrain,
  tileServerUrl,
  location,
}: PropsType): ReactElement => {
  type ProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
      vertexPosition: number,
      texCoord: number,
      vertexNormal: number,
    },
    uniformLocations: {
      projectionMatrix: WebGLUniformLocation,
      modelViewMatrix: WebGLUniformLocation,
    },
  };

  type TerrainBuffers = {
    position: WebGLBuffer,
    indices: WebGLBuffer,
    numVertices: number,
    normals: WebGLBuffer,
  }

  let pitch = 0;
  let yaw = 90;

  const terrainVertexStride = 5;

  const programInfoRef = useRef<ProgramInfo | null>(null);
  const terrainBuffersRef = useRef<TerrainBuffers | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);

  const loadShader = useCallback((type: number, source: string) => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const shader = gl.createShader(type);

    if (shader === null) {
      throw new Error('shader is null');
    }

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);

      throw new Error(`An error occurred compiling the shaders: ${log}`);
    }

    return shader;
  }, []);

  const compileProgram = useCallback((vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const shaderProgram = gl.createProgram();

    if (shaderProgram === null) {
      throw new Error('shaderProgram is null');
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    return shaderProgram;
  }, []);

  const initTerrainProgram = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const vertexShader = loadShader(gl.VERTEX_SHADER, terrainVertex);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, terrainFragment);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    return compileProgram(vertexShader, fragmentShader);
  }, [compileProgram, loadShader]);

  const createTerrainBuffer = useCallback((
    gl: WebGL2RenderingContext,
    numPointsX: number,
    numPointsY: number,
    startLatOffset: number,
    startLngOffset: number,
    latStep: number,
    lngStep: number,
  ): { positionBuffer: WebGLBuffer, positions: number[] } => {
    const positionBuffer = gl.createBuffer();

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

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return { positionBuffer, positions };
  }, [terrain.centers, terrain.points]);

  const createIndexBuffer = (
    gl: WebGL2RenderingContext,
    numPointsX: number,
    numPointsY: number,
  ): { indexBuffer: WebGLBuffer, indices: number[] } => {
    const indexBuffer = gl.createBuffer();

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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    return { indexBuffer, indices };
  };

  const computeNormal = (positions: number[], indices: number[], index: number) => {
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
  };

  const createNormalBuffer = useCallback((
    gl: WebGL2RenderingContext,
    positions: number[],
    indices: number[],
    numPointsX: number,
    numPointsY: number,
  ): WebGLBuffer => {
    const normalBuffer = gl.createBuffer();

    if (normalBuffer === null) {
      throw new Error('normalBuffer is null');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Create a normal for each face

    const faceNormals: vec3[] = [];

    for (let i = 0; i < indices.length; i += 3) {
      faceNormals.push(computeNormal(positions, indices, i));
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

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    return normalBuffer;
  }, []);

  const getStartOffset = useCallback((latLng: LatLng): {
    startLatOffset: number,
    startLngOffset: number,
  } => {
    const center = { lat: 40, lng: -105 };
    let startLatOffset = haversineGreatCircleDistance(
      latLng.lat, center.lng, center.lat, center.lng,
    );

    if (latLng.lat < center.lat) {
      startLatOffset = -startLatOffset;
    }

    let startLngOffset = haversineGreatCircleDistance(
      center.lat, latLng.lng, center.lat, center.lng,
    );

    if (latLng.lng < center.lng) {
      startLngOffset = -startLngOffset;
    }

    return {
      startLatOffset,
      startLngOffset,
    };
  }, []);

  const initBuffers = useCallback((): TerrainBuffers => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

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

    const { positionBuffer, positions } = createTerrainBuffer(
      gl, numPointsX, numPointsY, startLatOffset, startLngOffset, latStep, lngStep,
    );
    const { indexBuffer, indices } = createIndexBuffer(gl, numPointsX, numPointsY);
    const normalBuffer = createNormalBuffer(gl, positions, indices, numPointsX, numPointsY);

    // console.log(`number of positions: ${positions.length}`);
    // console.log(`number of indices: ${indices.length}`);

    // console.log(`min/max elevation: ${min}/${max} ${normalizeEle(min)}/${normalizeEle(max)}`);
    // console.log(`elevation: ${center + 2}, ${normalizeEle(center + 2)}`);

    return {
      position: positionBuffer,
      indices: indexBuffer,
      numVertices: indices.length,
      normals: normalBuffer,
    };
  }, [
    createNormalBuffer,
    createTerrainBuffer,
    getStartOffset,
    terrain.ne.lat,
    terrain.ne.lng,
    terrain.points,
    terrain.sw,
  ]);

  const drawTerrain = useCallback((
    gl: WebGL2RenderingContext,
    buffers: TerrainBuffers,
    projectionMatrix: mat4,
    modelViewMatrix: mat4,
  ) => {
    const programInfo = programInfoRef.current;
    if (programInfo === null) {
      throw new Error('programInfo is null');
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      3, // Number of components
      gl.FLOAT,
      false, // normalize
      terrainVertexStride * 4, // stride
      0, // offset
    );
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexPosition,
    );

    gl.vertexAttribPointer(
      programInfo.attribLocations.texCoord,
      2, // Number of components
      gl.FLOAT,
      false, // normalize
      terrainVertexStride * 4, // stride
      3 * 4, // offset
    );
    gl.enableVertexAttribArray(
      programInfo.attribLocations.texCoord,
    );

    // Tell WebGL how to pull out the normals from
    // the normal buffer into the vertexNormal attribute.
    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal,
      );
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix,
    );

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix,
    );

    gl.uniform1i(gl.getUniformLocation(programInfo.program, 'terrainTexture'), 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

    {
      const vertexCount = buffers.numVertices;
      const type = gl.UNSIGNED_INT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }, []);

  const getProjectionMatrix = (gl: WebGL2RenderingContext) => {
    // Set up the projection matrix
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 8000.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    return projectionMatrix;
  };

  const getModelViewMatrix = useCallback(() => {
    // Set up the view matrix

    const { startLatOffset, startLngOffset } = getStartOffset(position);

    const modelViewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(startLngOffset, startLatOffset, elevation + 2);

    const cameraTarget = vec3.fromValues(
      Math.cos((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((pitch * Math.PI) / 180),
    );

    vec3.normalize(cameraTarget, cameraTarget);
    cameraTarget[0] += cameraPos[0];
    cameraTarget[1] += cameraPos[1];
    cameraTarget[2] += cameraPos[2];

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    mat4.lookAt(modelViewMatrix, cameraPos, cameraTarget, cameraUp);

    return modelViewMatrix;
  }, [elevation, getStartOffset, pitch, position, yaw]);

  const drawScene = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const terrainBuffers = terrainBuffersRef.current;
    if (terrainBuffers === null) {
      throw new Error('terrainBuffers is null');
    }

    // Clear the canvas before we start drawing on it.
    // eslint-disable-next-line no-bitwise
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = getProjectionMatrix(gl);
    const modelViewMatrix = getModelViewMatrix();

    // Set up the normal matrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    drawTerrain(gl, terrainBuffers, projectionMatrix, modelViewMatrix);
  }, [drawTerrain, getModelViewMatrix]);

  const initTexture = useCallback((gl: WebGL2RenderingContext) => {
    const image = new Image();

    if (textureRef.current === null) {
      textureRef.current = gl.createTexture();
      if (textureRef.current === null) {
        throw new Error('textureRef.current is null');
      }

      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;

      const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, 256, 256, 0, srcFormat, srcType, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };

      image.crossOrigin = 'anonymous';
      image.src = `${tileServerUrl}/tile/detail/${location.zoom}/${location.x}/${location.y}`;
    }
  }, [location.x, location.y, location.zoom, tileServerUrl]);

  useEffect(() => {
    if (terrain) {
      const canvas = canvasRef.current;

      if (canvas !== null) {
      // Initialize the GL context
        glRef.current = canvas.getContext('webgl2');

        const gl = glRef.current;
        if (gl === null) {
          throw new Error('gl is null');
        }

        // Only continue if WebGL is available and working
        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        const shaderProgram = initTerrainProgram();

        if (shaderProgram === null) {
          throw new Error('shaderProgram is null');
        }

        // const count = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        // console.log(`count = ${count}`);

        // for (let i = 0; i < count; i += 1) {
        //   const info = gl.getActiveUniform(shaderProgram, i);
        //   if (info !== null) {
        //     console.log(`name: ${info.name}`);
        //   }
        // }

        const projectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

        if (projectionMatrix === null) {
          throw new Error('projectionMatrix is null');
        }

        const modelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

        if (modelViewMatrix === null) {
          throw new Error('modelViewMatrix is null');
        }

        programInfoRef.current = {
          program: shaderProgram,
          attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            texCoord: gl.getAttribLocation(shaderProgram, 'aTexCoord'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
          },
          uniformLocations: {
            projectionMatrix,
            modelViewMatrix,
          },
        };

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        terrainBuffersRef.current = initBuffers();

        initTexture(gl);

        // Draw the scene
        drawScene();
      }
    }
  }, [drawScene, initBuffers, initTerrainProgram, initTexture, terrain]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement> & {
      target: {
        setPointerCapture?: (id: number) => void,
      },
    },
  ) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (mouseRef.current) {
      const canvas = canvasRef.current;

      if (canvas) {
        const xOffset = event.clientX - mouseRef.current.x;
        const yOffset = event.clientY - mouseRef.current.y;

        yaw += xOffset * 0.1;
        pitch += yOffset * 0.1;

        pitch = Math.max(Math.min(pitch, 89), -89);

        drawScene();
        mouseRef.current = { x: event.clientX, y: event.clientY };
        event.stopPropagation();
        event.preventDefault();
      }
    }
  };

  const handlePointerUp = (event: React.MouseEvent) => {
    mouseRef.current = null;
    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerCapture = (event: React.MouseEvent) => {
    // console.log('got pointer capture');
  };

  const handlePointerRelease = (event: React.MouseEvent) => {
    // console.log('released pointer capture');
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <canvas
      ref={canvasRef}
      width="853"
      height="480"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onGotPointerCapture={handlePointerCapture}
      onLostPointerCapture={handlePointerRelease}
    />
  );
};

export default Terrain;
