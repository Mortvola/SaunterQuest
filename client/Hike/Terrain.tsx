import React, {
  ReactElement, useCallback, useEffect, useRef, useState,
} from 'react';
import { vec3, mat4 } from 'gl-matrix';
import { haversineGreatCircleDistance } from '../utilities';
import terrainVertex from './TerrainVertex.vert';
import terrainFragment from './TerrainFragment.frag';
import lineVertex from './LineVertex.vert';
import lineFragment from './LineFragment.frag';
import { LatLng } from '../state/Types';

export type Points = {
  ne: { lat: number, lng: number },
  sw: { lat: number, lng: number },
  points: number[][],
  centers: number[][],
  lineStrings: number[][][],
};

export type Location = {
  x: number,
  y: number,
  zoom: number,
};

type PropsType = {
  position: LatLng,
  terrain: Points,
  tileServerUrl: string,
  location: Location,
}

const Terrain = ({
  position,
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
      normalMatrix: WebGLUniformLocation,
    },
  };

  type LineProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
      vertexPosition: number,
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
    normal: WebGLBuffer,
    centerElevation: number,
  }

  type LineBuffers = {
    lines: WebGLBuffer,
    numLinePoints: number,
  }

  let pitch = 0;
  let yaw = 90;

  const terrainVertexStride = 5;

  const programInfoRef = useRef<ProgramInfo | null>(null);
  const lineProgramInfoRef = useRef<LineProgramInfo | null>(null);
  const terrainBuffersRef = useRef<TerrainBuffers | null>(null);
  const lineBuffersRef = useRef<LineBuffers | null>(null);
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

  const initLineProgram = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const vertexShader = loadShader(gl.VERTEX_SHADER, lineVertex);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, lineFragment);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    return compileProgram(vertexShader, fragmentShader);
  }, [compileProgram, loadShader]);

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

  const getMinMaxElevation = useCallback((): { min: number, max: number, center: number } => {
    let min = terrain.points[0][0];
    let max = terrain.points[0][0];
    for (let j = 0; j < terrain.points.length; j += 1) {
      for (let i = 0; i < terrain.points[j].length; i += 1) {
        if (terrain.points[j][i] > max) {
          max = terrain.points[j][i];
        }

        if (terrain.points[j][i] < min) {
          min = terrain.points[j][i];
        }
      }
    }

    for (let j = 0; j < terrain.lineStrings.length; j += 1) {
      for (let i = 0; i < terrain.lineStrings[j].length; i += 1) {
        if (terrain.lineStrings[j][i][2] > max) {
          [, , max] = terrain.lineStrings[j][i];
        }

        if (terrain.lineStrings[j][i][2] < min) {
          [, , min] = terrain.lineStrings[j][i];
        }
      }
    }

    const center1 = terrain.points[Math.floor(terrain.points.length / 2)];
    const center = center1[Math.floor(center1.length / 2)];

    return { min, max, center };
  }, [terrain.lineStrings, terrain.points]);

  const createPositionsBuffer = useCallback((
    gl: WebGL2RenderingContext,
    numPointsX: number,
    numPointsY: number,
    latStep: number,
    lngStep: number,
    latOffset: number,
    lngOffset: number,
    normalizeEle: (e: number) => number,
  ): { positionBuffer: WebGLBuffer, positions: number[] } => {
    const positionBuffer = gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    const positions = [];

    for (let i = 0; i < numPointsX; i += 1) {
      positions.push(i * lngStep - lngOffset);
      positions.push(0 * latStep - latOffset);
      positions.push(normalizeEle(terrain.points[0][i]));

      // texture coordinates
      positions.push(i / (numPointsX - 1));
      positions.push(1);
    }

    for (let j = 1; j < numPointsY; j += 1) {
      positions.push(0 * lngStep - lngOffset);
      positions.push(j * latStep - latOffset);
      positions.push(normalizeEle(terrain.points[j][0]));

      // texture coordinates
      positions.push(0);
      positions.push(1 - j / (numPointsY - 1));

      for (let i = 1; i < numPointsX; i += 1) {
        positions.push((i - 0.5) * lngStep - lngOffset);
        positions.push((j - 0.5) * latStep - latOffset);
        positions.push(normalizeEle(terrain.centers[j - 1][i - 1]));

        // texture coordinates
        positions.push((i - 0.5) / (numPointsX - 1));
        positions.push(1 - (j - 0.5) / (numPointsY - 1));

        positions.push(i * lngStep - lngOffset);
        positions.push(j * latStep - latOffset);
        positions.push(normalizeEle(terrain.points[j][i]));

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

    const summedNormals: vec3[] = [];

    const sumNormals = (indexes: number[]) => {
      const vec = [0, 0, 0];
      for (let i = 0; i < indexes.length; i += 1) {
        vec[0] += faceNormals[indexes[i]][0];
        vec[1] += faceNormals[indexes[i]][1];
        vec[2] += faceNormals[indexes[i]][2];
      }

      const normal = vec3.fromValues(vec[0], vec[1], vec[2]);
      vec3.normalize(normal, normal);

      summedNormals.push(normal);
    };

    sumNormals([0, 3]);

    for (let i = 4; i < (numPointsX - 1) * 4; i += 4) {
      sumNormals([i - 1, i + 3, i + 6, i]);
    }

    sumNormals([(numPointsX - 1) * 4, (numPointsX - 1) * 4 + 1]);

    for (let j = 1; j < numPointsY - 1; j += 1) {
      sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + 3,
        (j - 1) * (numPointsX - 1) * 4 + 2,
        (j + 0) * (numPointsX - 1) * 4 + 0,
        (j + 0) * (numPointsX - 1) * 4 + 3,
      ]);

      for (let i = 1; i < numPointsX - 1; i += 1) {
        sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 1,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 4,
        ]);

        sumNormals([
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 2,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 3,
          (j - 1) * (numPointsX - 1) * 4 + i * 4 + 2,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 4,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 - 3,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 0,
          (j + 0) * (numPointsX - 1) * 4 + i * 4 + 3,
        ]);
      }

      sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
      ]);

      sumNormals([
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
        (j - 1) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
        (j + 0) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
      ]);
    }

    sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + 3,
    ]);

    for (let i = 1; i < numPointsX - 1; i += 1) {
      sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 1,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 4,
      ]);

      sumNormals([
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 2,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 - 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 3,
        (numPointsY - 2) * (numPointsX - 1) * 4 + i * 4 + 2,
      ]);
    }

    sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 1,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 4,
    ]);

    sumNormals([
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 2,
      (numPointsY - 2) * (numPointsX - 1) * 4 + ((numPointsX - 1) * 4) - 3,
    ]);

    // Set the vertex normals

    const vertexNormals = [];

    for (let i = 0; i < summedNormals.length; i += 1) {
      vertexNormals.push(...summedNormals[i]);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);

    return normalBuffer;
  }, []);

  const createLinesBuffer = useCallback((
    gl: WebGL2RenderingContext,
    latStep: number,
    lngStep: number,
    normalizeEle: (e: number) => number,
  ): { lineBuffer: WebGLBuffer, lines: number[] } => {
    // Create a buffer for lines
    const lineBuffer = gl.createBuffer();

    if (lineBuffer === null) {
      throw new Error('lineBuffer is null');
    }

    const normalizeLatLng = (lng: number, lat: number): [number, number] => ([
      (((lng - terrain.sw.lng) / (terrain.ne.lng - terrain.sw.lng)) * 2 - 1) * lngStep,
      (((lat - terrain.sw.lat) / (terrain.ne.lat - terrain.sw.lat)) * 2 - 1) * latStep,
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);

    const lines = [];

    // lines.push(
    //   ...normalizeLatLng(points.selected.lng, points.selected.lat),
    //   1.0,
    // );

    // lines.push(
    //   lines[0],
    //   lines[1],
    //   normalizeEle(points.elevation),
    // );

    for (let j = 0; j < terrain.lineStrings.length; j += 1) {
      for (let i = 0; i < terrain.lineStrings[j].length - 1; i += 1) {
        lines.push(
          ...normalizeLatLng(
            terrain.lineStrings[j][i][0],
            terrain.lineStrings[j][i][1],
          ),
          normalizeEle(terrain.lineStrings[j][i][2] + 1),
        );

        lines.push(
          ...normalizeLatLng(
            terrain.lineStrings[j][i + 1][0],
            terrain.lineStrings[j][i + 1][1],
          ),
          normalizeEle(terrain.lineStrings[j][i + 1][2] + 1),
        );
      }
    }

    // Add normals to lines
    // for (let i = 0; i < (numPointsY - 1) * (numPointsX - 1) * 12; i += 1) {
    //   const v0 = vec3.fromValues(
    //     vertexNormals[indices[i] * 3 + 0],
    //     vertexNormals[indices[i] * 3 + 1],
    //     vertexNormals[indices[i] * 3 + 2],
    //   );

    //   const v1 = vec3.fromValues(
    //     positions[indices[i] * 3 + 0],
    //     positions[indices[i] * 3 + 1],
    //     positions[indices[i] * 3 + 2],
    //   );

    //   const v3 = vec3.fromValues(0.01, 0.01, 0.01);
    //   const v4 = vec3.fromValues(0.05, 0.05, 0.05);

    //   const v2 = vec3.create();

    //   vec3.multiply(v2, v0, v3);
    //   vec3.add(v1, v1, v2);
    //   lines.push(...v1);

    //   vec3.multiply(v2, v0, v4);
    //   vec3.add(v1, v1, v2);
    //   lines.push(...v1);
    // }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);

    return { lineBuffer, lines };
  }, [terrain.lineStrings, terrain.ne.lat, terrain.ne.lng, terrain.sw.lat, terrain.sw.lng]);

  const initBuffers = useCallback((): [TerrainBuffers, LineBuffers] => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const numPointsX = terrain.points[0].length;
    const numPointsY = terrain.points.length;

    const { min, max, center } = getMinMaxElevation();
    const delta = max - min;

    const latDistance = haversineGreatCircleDistance(
      terrain.ne.lat, terrain.sw.lng, terrain.sw.lat, terrain.sw.lng,
    );
    const lngDistance = haversineGreatCircleDistance(
      terrain.sw.lat, terrain.ne.lng, terrain.sw.lat, terrain.sw.lng,
    );

    const latOffset = haversineGreatCircleDistance(
      terrain.sw.lat, position.lng, position.lat, position.lng,
    );
    const lngOffset = haversineGreatCircleDistance(
      position.lat, terrain.sw.lng, position.lat, position.lng,
    );

    console.log(`ne: ${JSON.stringify(terrain.ne)}, sw: ${JSON.stringify(terrain.sw)})`);
    console.log(`position: ${JSON.stringify(position)}`);

    // const zScale = 1;
    const latStep = latDistance / (numPointsY - 1);
    const lngStep = lngDistance / (numPointsX - 1);

    const normalizeEle = (e: number) => e; // ((e - min - delta / 2) * zScale);

    // console.log(`zscale: ${zScale}, latStep=${latStep}, lngStep=${lngStep}`);
    // console.log(`${-1 * lngStep}, ${1 * latStep} to ${1 * lngStep}, ${-1 * latStep}`);

    const { positionBuffer, positions } = createPositionsBuffer(
      gl, numPointsX, numPointsY, latStep, lngStep, latOffset, lngOffset, normalizeEle,
    );
    const { indexBuffer, indices } = createIndexBuffer(gl, numPointsX, numPointsY);
    const normalBuffer = createNormalBuffer(gl, positions, indices, numPointsX, numPointsY);
    const { lineBuffer, lines } = createLinesBuffer(gl, latStep, lngStep, normalizeEle);

    // console.log(`number of positions: ${positions.length}`);
    // console.log(`number of indices: ${indices.length}`);

    // console.log(`min/max elevation: ${min}/${max} ${normalizeEle(min)}/${normalizeEle(max)}`);
    // console.log(`elevation: ${center + 2}, ${normalizeEle(center + 2)}`);

    return [
      {
        position: positionBuffer,
        indices: indexBuffer,
        numVertices: indices.length,
        normal: normalBuffer,
        centerElevation: normalizeEle(center + 2),
      },
      {
        lines: lineBuffer,
        numLinePoints: lines.length / 3,
      },
    ];
  }, [
    createLinesBuffer,
    createNormalBuffer,
    createPositionsBuffer,
    getMinMaxElevation,
    position,
    terrain.ne,
    terrain.points,
    terrain.sw,
  ]);

  const drawTerrain = useCallback((
    gl: WebGL2RenderingContext,
    buffers: TerrainBuffers,
    projectionMatrix: mat4,
    modelViewMatrix: mat4,
    normalMatrix: mat4,
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
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
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

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix,
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

  const drawTrails = useCallback((
    gl: WebGL2RenderingContext,
    buffers: LineBuffers,
    projectionMatrix: mat4,
    modelViewMatrix: mat4,
  ) => {
    const lineProgramInfo = lineProgramInfoRef.current;
    if (lineProgramInfo === null) {
      throw new Error('lineProgramInfo is null');
    }

    gl.useProgram(lineProgramInfo.program);

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 3; // pull out 2 values per iteration
      const type = gl.FLOAT; // the data in the buffer is 32bit floats
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0; // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.lines);
      gl.vertexAttribPointer(
        lineProgramInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(
        lineProgramInfo.attribLocations.vertexPosition,
      );
    }

    gl.uniformMatrix4fv(
      lineProgramInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix,
    );
    gl.uniformMatrix4fv(
      lineProgramInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix,
    );

    {
      const count = buffers.numLinePoints;
      const offset = 0;
      gl.drawArrays(gl.LINES, offset, count);
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

  const getModelViewMatrix = useCallback((centerElevation: number) => {
    // Set up the view matrix
    const elevation = 4345;
    console.log(centerElevation);

    const modelViewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(0.0, 0.0, elevation);

    const cameraTarget = vec3.fromValues(
      Math.cos((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((pitch * Math.PI) / 180),
    );
    vec3.normalize(cameraTarget, cameraTarget);
    cameraTarget[2] += elevation;

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    mat4.lookAt(modelViewMatrix, cameraPos, cameraTarget, cameraUp);

    return modelViewMatrix;
  }, [pitch, yaw]);

  const drawScene = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const terrainBuffers = terrainBuffersRef.current;
    if (terrainBuffers === null) {
      throw new Error('terrainBuffers is null');
    }

    const lineBuffers = lineBuffersRef.current;
    if (lineBuffers === null) {
      throw new Error('lineBuffers is null');
    }

    // Clear the canvas before we start drawing on it.
    // eslint-disable-next-line no-bitwise
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = getProjectionMatrix(gl);
    const modelViewMatrix = getModelViewMatrix(terrainBuffers.centerElevation);

    // Set up the normal matrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    drawTerrain(gl, terrainBuffers, projectionMatrix, modelViewMatrix, normalMatrix);
    drawTrails(gl, lineBuffers, projectionMatrix, modelViewMatrix);
  }, [drawTerrain, drawTrails, getModelViewMatrix]);

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
        console.log('image loaded');

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

        const count = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        console.log(`count = ${count}`);

        for (let i = 0; i < count; i += 1) {
          const info = gl.getActiveUniform(shaderProgram, i);
          if (info !== null) {
            console.log(`name: ${info.name}`);
          }
        }

        const projectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');

        if (projectionMatrix === null) {
          throw new Error('projectionMatrix is null');
        }

        const modelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

        if (modelViewMatrix === null) {
          throw new Error('modelViewMatrix is null');
        }

        const normalMatrix = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');

        if (normalMatrix === null) {
          throw new Error('normalMatrix is null');
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
            normalMatrix,
          },
        };

        const lineProgram = initLineProgram();

        if (lineProgram === null) {
          throw new Error('lineProgram is null');
        }

        const projectionMatrix2 = gl.getUniformLocation(lineProgram, 'uProjectionMatrix');

        if (projectionMatrix2 === null) {
          throw new Error('projectionMatrix2 is null');
        }

        const modelViewMatrix2 = gl.getUniformLocation(lineProgram, 'uModelViewMatrix');

        if (modelViewMatrix2 === null) {
          throw new Error('modelViewMatrix2 is null');
        }

        lineProgramInfoRef.current = {
          program: lineProgram,
          attribLocations: {
            vertexPosition: gl.getAttribLocation(lineProgram, 'aVertexPosition'),
          },
          uniformLocations: {
            projectionMatrix: projectionMatrix2,
            modelViewMatrix: modelViewMatrix2,
          },
        };

        // Here's where we call the routine that builds all the
        // objects we'll be drawing.
        [terrainBuffersRef.current, lineBuffersRef.current] = initBuffers();

        initTexture(gl);

        // Draw the scene
        drawScene();
      }
    }
  }, [drawScene, initBuffers, initLineProgram, initTerrainProgram, initTexture, terrain]);

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
