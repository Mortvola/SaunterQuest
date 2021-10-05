import { latDistance, lngDistance } from '../utilities';
import { LatLng } from '../state/Types';

// eslint-disable-next-line import/prefer-default-export
export const getStartOffset = (latLng: LatLng): {
  startLatOffset: number,
  startLngOffset: number,
} => {
  const center = { lat: 40, lng: -105 };
  let startLatOffset = latDistance(latLng.lat, center.lat);

  if (latLng.lat < center.lat) {
    startLatOffset = -startLatOffset;
  }

  let startLngOffset = lngDistance(latLng.lng, center.lng);

  if (latLng.lng < center.lng) {
    startLngOffset = -startLngOffset;
  }

  return {
    startLatOffset,
    startLngOffset,
  };
};

export const loadShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader => {
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
};

export const compileProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram => {
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
};
