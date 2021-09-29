import React, {
  ReactElement, useCallback, useEffect, useRef,
} from 'react';
import { vec3, mat4 } from 'gl-matrix';
import { haversineGreatCircleDistance } from '../utilities';

export type Points = {
  ne: { lat: number, lng: number },
  sw: { lat: number, lng: number },
  points: number[][],
  centers: number[][],
  lineStrings: number[][][],
};

type PropsType = {
  terrain: Points,
}

const Terrain = ({
  terrain,
}: PropsType): ReactElement => {
  type ProgramInfo = {
    program: WebGLProgram,
    attribLocations: {
      vertexPosition: number,
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

  type Buffers = {
    position: WebGLBuffer,
    indices: WebGLBuffer,
    numVertices: number,
    normal: WebGLBuffer,
    lines: WebGLBuffer,
    numLinePoints: number,
    centerElevation: number,
  }

  let pitch = 0;
  let yaw = 90;

  const programInfoRef = useRef<ProgramInfo | null>(null);
  const lineProgramInfoRef = useRef<LineProgramInfo | null>(null);
  const buffersRef = useRef<Buffers | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);

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
      gl.deleteShader(shader);

      throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
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

  const initShaderProgram = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec3 vLighting;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);
      // highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
      highp vec3 directionalVector = normalize(vec3(0, -1, -1));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;
    const fsSource = `
    varying highp vec3 vLighting;
    
    void main() {
      highp vec3 color = vec3(1.0, 1.0, 1.0);
      gl_FragColor = vec4(color * vLighting, 1.0);
    }
  `;
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    return compileProgram(vertexShader, fragmentShader);
  }, [compileProgram, loadShader]);

  const initLineProgram = useCallback(() => {
    const vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;
    const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `;

    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);

    if (vertexShader === null) {
      throw new Error('vertexShader is null');
    }

    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    if (fragmentShader === null) {
      throw new Error('fragmentShader is null');
    }

    return compileProgram(vertexShader, fragmentShader);
  }, [compileProgram, loadShader]);

  const computeNormal = (positions: number[], indices: number[], index: number) => {
    const v1 = vec3.fromValues(
      positions[indices[index + 2] * 3 + 0] - positions[indices[index + 1] * 3 + 0],
      positions[indices[index + 2] * 3 + 1] - positions[indices[index + 1] * 3 + 1],
      positions[indices[index + 2] * 3 + 2] - positions[indices[index + 1] * 3 + 2],
    );

    const v2 = vec3.fromValues(
      positions[indices[index] * 3 + 0] - positions[indices[index + 1] * 3 + 0],
      positions[indices[index] * 3 + 1] - positions[indices[index + 1] * 3 + 1],
      positions[indices[index] * 3 + 2] - positions[indices[index + 1] * 3 + 2],
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
    gl: WebGLRenderingContext,
    numPointsX: number,
    numPointsY: number,
    xyDelta: number,
    latScale: number,
    lngScale: number,
    normalizeEle: (e: number) => number,
  ): { positionBuffer: WebGLBuffer, positions: number[] } => {
    const positionBuffer = gl.createBuffer();

    if (positionBuffer === null) {
      throw new Error('positionBuffer is null');
    }

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [];

    let x = -1.0;
    let y = 1.0;
    for (let i = 0; i < numPointsX; i += 1) {
      positions.push(x * lngScale);
      positions.push(y * latScale);
      positions.push(normalizeEle(terrain.points[0][i]));

      x += xyDelta;
    }

    for (let j = 1; j < numPointsY; j += 1) {
      x = -1.0;
      y -= xyDelta;

      positions.push(x * lngScale);
      positions.push(y * latScale);
      positions.push(normalizeEle(terrain.points[j][0]));

      for (let i = 1; i < numPointsX; i += 1) {
        x += xyDelta;

        positions.push((x - xyDelta / 2) * lngScale);
        positions.push((y + xyDelta / 2) * latScale);
        positions.push(normalizeEle(terrain.centers[j - 1][i - 1]));

        positions.push(x * lngScale);
        positions.push(y * latScale);
        positions.push(normalizeEle(terrain.points[j][i]));
      }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return { positionBuffer, positions };
  }, [terrain.centers, terrain.points]);

  const createIndexBuffer = (
    gl: WebGLRenderingContext,
    numPointsX: number,
    numPointsY: number,
  ): { indexBuffer: WebGLBuffer, indices: number[] } => {
    const indexBuffer = gl.createBuffer();

    if (indexBuffer === null) {
      throw new Error('indexBuffer is null');
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [];

    for (let i = 0; i < numPointsX - 1; i += 1) {
      indices.push(i);
      indices.push(i + 1);
      indices.push(numPointsX + i * 2 + 1);

      indices.push(i + 1);
      indices.push(numPointsX + i * 2 + 2);
      indices.push(numPointsX + i * 2 + 1);

      indices.push(numPointsX + i * 2 + 2);
      indices.push(numPointsX + i * 2 + 0);
      indices.push(numPointsX + i * 2 + 1);

      indices.push(numPointsX + i * 2 + 0);
      indices.push(i);
      indices.push(numPointsX + i * 2 + 1);
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

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    return { indexBuffer, indices };
  };

  const createNormalBuffer = useCallback((
    gl: WebGLRenderingContext,
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
    gl: WebGLRenderingContext,
    latScale: number,
    lngScale: number,
    normalizeEle: (e: number) => number,
  ): { lineBuffer: WebGLBuffer, lines: number[] } => {
    // Create a buffer for lines
    const lineBuffer = gl.createBuffer();

    if (lineBuffer === null) {
      throw new Error('lineBuffer is null');
    }

    const normalizeLatLng = (lng: number, lat: number): [number, number] => ([
      (((lng - terrain.sw.lng) / (terrain.ne.lng - terrain.sw.lng)) * 2 - 1) * lngScale,
      (((lat - terrain.sw.lat) / (terrain.ne.lat - terrain.sw.lat)) * 2 - 1) * latScale,
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

  const initBuffers = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const numPointsX = terrain.points[0].length;
    const numPointsY = terrain.points.length;

    const { min, max, center } = getMinMaxElevation();
    const delta = max - min;

    const xyDelta = 2.0 / (terrain.points.length - 1);

    const latDistance = haversineGreatCircleDistance(
      terrain.ne.lat, terrain.sw.lng, terrain.sw.lat, terrain.sw.lng,
    );
    const lngDistance = haversineGreatCircleDistance(
      terrain.sw.lat, terrain.ne.lng, terrain.sw.lat, terrain.sw.lng,
    );
    let zScale = 1.0 / latDistance;
    let latScale = 1.0;
    let lngScale = lngDistance / latDistance;
    if (lngDistance > latDistance) {
      zScale = 1.0 / lngDistance;
      latScale = latDistance / lngDistance;
      lngScale = 1.0;
    }

    zScale = 1;
    latScale = latDistance / 2;
    lngScale = lngDistance / 2;

    const normalizeEle = (e: number) => ((e - min - delta / 2) * zScale);

    // console.log(`zscale: ${zScale}, latScale=${latScale}, lngScale=${lngScale}`);
    // console.log(`${-1 * lngScale}, ${1 * latScale} to ${1 * lngScale}, ${-1 * latScale}`);

    const { positionBuffer, positions } = createPositionsBuffer(
      gl, numPointsX, numPointsY, xyDelta, latScale, lngScale, normalizeEle,
    );
    const { indexBuffer, indices } = createIndexBuffer(gl, numPointsX, numPointsY);
    const normalBuffer = createNormalBuffer(gl, positions, indices, numPointsX, numPointsY);
    const { lineBuffer, lines } = createLinesBuffer(gl, latScale, lngScale, normalizeEle);

    // console.log(`number of positions: ${positions.length}`);
    // console.log(`number of indices: ${indices.length}`);

    // console.log(`min/max elevation: ${min}/${max} ${normalizeEle(min)}/${normalizeEle(max)}`);
    // console.log(`elevation: ${center + 2}, ${normalizeEle(center + 2)}`);

    return {
      position: positionBuffer,
      indices: indexBuffer,
      numVertices: indices.length,
      normal: normalBuffer,
      lines: lineBuffer,
      numLinePoints: lines.length / 3,
      centerElevation: normalizeEle(center + 2),
    };
  }, [
    createLinesBuffer,
    createNormalBuffer,
    createPositionsBuffer,
    getMinMaxElevation,
    terrain.ne.lat,
    terrain.ne.lng,
    terrain.points,
    terrain.sw.lat,
    terrain.sw.lng,
  ]);

  const drawScene = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
    }

    const buffers = buffersRef.current;
    if (buffers === null) {
      throw new Error('buffers is null');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    // eslint-disable-next-line no-bitwise
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up the projection matrix
    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 6000.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    // Set up the view matrix
    const modelViewMatrix = mat4.create();
    const cameraPos = vec3.fromValues(0.0, 0.0, buffers.centerElevation + 2);

    const cameraTarget = vec3.fromValues(
      Math.cos((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((yaw * Math.PI) / 180) * Math.cos((pitch * Math.PI) / 180),
      Math.sin((pitch * Math.PI) / 180),
    );
    vec3.normalize(cameraTarget, cameraTarget);
    cameraTarget[2] += buffers.centerElevation + 2;

    const cameraUp = vec3.fromValues(0.0, 0.0, 1.0);

    mat4.lookAt(modelViewMatrix, cameraPos, cameraTarget, cameraUp);

    // Set up the normal matrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    const programInfo = programInfoRef.current;
    if (programInfo === null) {
      throw new Error('programInfo is null');
    }

    const lineProgramInfo = lineProgramInfoRef.current;
    if (lineProgramInfo === null) {
      throw new Error('lineProgramInfo is null');
    }

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 3; // pull out 2 values per iteration
      const type = gl.FLOAT; // the data in the buffer is 32bit floats
      const normalize = false; // don't normalize
      const stride = 0; // how many bytes to get from one set of values to the next
      // 0 = use type and numComponents above
      const offset = 0; // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
      );
      gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition,
      );
    }

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

    {
      const vertexCount = buffers.numVertices;
      const type = gl.UNSIGNED_INT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
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
  }, [pitch, yaw]);

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
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT);

        const shaderProgram = initShaderProgram();

        if (shaderProgram === null) {
          throw new Error('shaderProgram is null');
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
        buffersRef.current = initBuffers();

        // Draw the scene
        drawScene();
      }
    }
  }, [drawScene, initBuffers, initLineProgram, initShaderProgram, terrain]);

  const handleMouseDown = (event: React.MouseEvent) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    event.stopPropagation();
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
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

  const handleMouseUp = (event: React.MouseEvent) => {
    mouseRef.current = null;
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      width="853"
      height="480"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default Terrain;
