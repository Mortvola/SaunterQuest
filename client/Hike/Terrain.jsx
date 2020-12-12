import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { vec3, mat4 } from 'gl-matrix';
import Quaternion from 'quaternion';
import { haversineGreatCircleDistance } from '../utilities';

let gl = null;
let programInfo = null;
let lineProgramInfo = null;
let buffers = null;
let xRotation = Math.PI * 2;
let yRotation = 0;
let rotation = mat4.create();
let accumQ = null;

const Terrain = ({
  points,
}) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef(null);

  const loadShader = (type, source) => {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const compileProgram = (vertexShader, fragmentShader) => {
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }

    return shaderProgram;
  };

  const initShaderProgram = () => {
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
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    return compileProgram(vertexShader, fragmentShader);
  };

  const initLineProgram = () => {
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

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    return compileProgram(vertexShader, fragmentShader);
  };

  const computeNormal = (positions, indices, index) => {
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

  const getMinMaxElevation = () => {
    let min = points.points[0][0];
    let max = points.points[0][0];
    for (let j = 0; j < points.points.length; j += 1) {
      for (let i = 0; i < points.points[j].length; i += 1) {
        if (points.points[j][i] > max) {
          max = points.points[j][i];
        }

        if (points.points[j][i] < min) {
          min = points.points[j][i];
        }
      }
    }

    for (let j = 0; j < points.lineStrings.length; j += 1) {
      for (let i = 0; i < points.lineStrings[j].length; i += 1) {
        if (points.lineStrings[j][i][2] > max) {
          [, , max] = points.lineStrings[j][i];
        }

        if (points.lineStrings[j][i][2] < min) {
          [, , min] = points.lineStrings[j][i];
        }
      }
    }

    return { min, max };
  };

  const initBuffers = () => {
    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const { min, max } = getMinMaxElevation();
    const delta = max - min;

    const positions = [];
    const xyDelta = 2.0 / (points.points.length - 1);

    const latDistance = haversineGreatCircleDistance(
      points.ne.lat, points.sw.lng, points.sw.lat, points.sw.lng,
    );
    const lngDistance = haversineGreatCircleDistance(
      points.sw.lat, points.ne.lng, points.sw.lat, points.sw.lng,
    );
    let zScale = 2.0 / latDistance;
    let latScale2 = 1.0;
    let lngScale2 = lngDistance / latDistance;
    if (lngDistance > latDistance) {
      zScale = 2.0 / lngDistance;
      latScale2 = latDistance / lngDistance;
      lngScale2 = 1.0;
    }

    const normalizeEle = (v) => ((v - min - delta) * zScale);

    const normalizeLatLng = (lng, lat) => ([
      (((lng - points.sw.lng) / (points.ne.lng - points.sw.lng)) * 2 - 1) * lngScale2,
      (((lat - points.sw.lat) / (points.ne.lat - points.sw.lat)) * 2 - 1) * latScale2,
    ]);

    const numPointsX = points.points[0].length;
    const numPointsY = points.points.length;

    let x = -1.0;
    let y = 1.0;
    for (let i = 0; i < numPointsX; i += 1) {
      positions.push(x * lngScale2);
      positions.push(y * latScale2);
      positions.push(normalizeEle(points.points[0][i]));

      x += xyDelta;
    }

    for (let j = 1; j < numPointsY; j += 1) {
      x = -1.0;
      y -= xyDelta;

      positions.push(x * lngScale2);
      positions.push(y * latScale2);
      positions.push(normalizeEle(points.points[j][0]));

      for (let i = 1; i < numPointsX; i += 1) {
        x += xyDelta;

        positions.push((x - xyDelta / 2) * lngScale2);
        positions.push((y + xyDelta / 2) * latScale2);
        positions.push(normalizeEle(points.centers[j - 1][i - 1]));

        positions.push(x * lngScale2);
        positions.push(y * latScale2);
        positions.push(normalizeEle(points.points[j][i]));
      }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
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

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Create a normal for each face

    const faceNormals = [];

    for (let i = 0; i < indices.length; i += 3) {
      faceNormals.push(computeNormal(positions, indices, i));
    }

    // Sum the face normals that share a vertex

    const summedNormals = [];

    const sumNormals = (indexes) => {
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

    // Create a buffer for lines
    const lineBuffer = gl.createBuffer();
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

    for (let j = 0; j < points.lineStrings.length; j += 1) {
      for (let i = 0; i < points.lineStrings[j].length - 1; i += 1) {
        lines.push(
          ...normalizeLatLng(
            points.lineStrings[j][i][0],
            points.lineStrings[j][i][1],
          ),
          normalizeEle(points.lineStrings[j][i][2]) + 0.025,
        );

        lines.push(
          ...normalizeLatLng(
            points.lineStrings[j][i + 1][0],
            points.lineStrings[j][i + 1][1],
          ),
          normalizeEle(points.lineStrings[j][i + 1][2]) + 0.025,
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

    return {
      position: positionBuffer,
      indices: indexBuffer,
      numVertices: indices.length,
      normal: normalBuffer,
      lines: lineBuffer,
      numLinePoints: lines.length / 3,
    };
  };

  const drawScene = () => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    // eslint-disable-next-line no-bitwise
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = (45 * Math.PI) / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      [0.0, 0.0, -2.5]); // amount to translate

    const invert = mat4.create();
    mat4.invert(invert, rotation);
    mat4.multiply(modelViewMatrix, modelViewMatrix, invert);

    // mat4.translate(modelViewMatrix, // destination matrix
    //   modelViewMatrix, // matrix to translate
    //   [0.0, 0.0, -0.5]); // amount to translate

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

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
      const type = gl.UNSIGNED_SHORT;
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
  };

  useEffect(() => {
    if (points) {
      const canvas = canvasRef.current;
      // Initialize the GL context
      gl = canvas.getContext('webgl');

      // Only continue if WebGL is available and working
      if (gl !== null) {
        // Set clear color to black, fully opaque
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      const shaderProgram = initShaderProgram();

      programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
          normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
        },
      };

      const lineProgram = initLineProgram();

      lineProgramInfo = {
        program: lineProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(lineProgram, 'aVertexPosition'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(lineProgram, 'uProjectionMatrix'),
          modelViewMatrix: gl.getUniformLocation(lineProgram, 'uModelViewMatrix'),
        },
      };

      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      buffers = initBuffers();

      // Draw the scene
      drawScene();
    }
  }, [points]);

  const handleMouseDown = (event) => {
    mouseRef.current = { x: event.clientX, y: event.clientY };
    event.stopPropagation();
    event.preventDefault();
  };

  const handleMouseMove = (event) => {
    if (mouseRef.current) {
      yRotation = ((event.clientX - mouseRef.current.x)
        / canvasRef.current.clientWidth) * Math.PI;
      xRotation = ((event.clientY - mouseRef.current.y)
        / canvasRef.current.clientHeight) * Math.PI;

      const q = Quaternion.fromEuler(0, -xRotation, -yRotation, 'XYZ');

      if (accumQ) {
        accumQ = accumQ.mul(q);
      }
      else {
        accumQ = q;
      }

      rotation = accumQ.conjugate().toMatrix4();

      drawScene();
      mouseRef.current = { x: event.clientX, y: event.clientY };
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const handleMouseUp = (event) => {
    mouseRef.current = null;
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <canvas
      ref={canvasRef}
      width="640"
      height="480"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

Terrain.propTypes = {
  points: PropTypes.shape(),
};

Terrain.defaultProps = {
  points: null,
};

export default Terrain;
