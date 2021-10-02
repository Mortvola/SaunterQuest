import React, {
  ReactElement, useCallback, useEffect, useRef,
} from 'react';
import { vec3, mat4 } from 'gl-matrix';
import { LatLng } from '../state/Types';
import { Points } from '../ResponseTypes';
import TerrainTile from './TerrainTile';
import { getStartOffset } from './TerrainCommon';

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
  let pitch = 0;
  let yaw = 90;

  const terrainTileRef = useRef<TerrainTile | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);

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
  }, [elevation, pitch, position, yaw]);

  const drawScene = useCallback(() => {
    const gl = glRef.current;
    if (gl === null) {
      throw new Error('gl is null');
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

    if (terrainTileRef.current === null) {
      throw new Error('terrainTailRef.current is null');
    }

    terrainTileRef.current.drawTerrain(projectionMatrix, modelViewMatrix);
  }, [getModelViewMatrix]);

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

        if (terrainTileRef.current === null) {
          terrainTileRef.current = new TerrainTile(gl, location, tileServerUrl, terrain);
        }

        // Draw the scene
        drawScene();
      }
    }
  }, [drawScene, location, terrain, tileServerUrl]);

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
