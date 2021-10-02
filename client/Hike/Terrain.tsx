import React, {
  ReactElement, useEffect, useRef,
} from 'react';
import { LatLng } from '../state/Types';
import TerrainTile from './TerrainTile';
import TerrainRenderer from './TerrainRenderer';

export type Location = {
  x: number,
  y: number,
  zoom: number,
};

type PropsType = {
  position: LatLng,
  elevation: number,
  tileServerUrl: string,
  pathFinderUrl: string,
  location: Location,
}

const Terrain = ({
  position,
  elevation,
  tileServerUrl,
  pathFinderUrl,
  location,
}: PropsType): ReactElement => {
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas !== null) {
      // Initialize the GL context
      const gl = canvas.getContext('webgl2');

      if (gl === null) {
        throw new Error('gl is null');
      }

      if (rendererRef.current === null) {
        rendererRef.current = new TerrainRenderer(gl, position, elevation);

        const tile = new TerrainTile(gl, location, tileServerUrl, pathFinderUrl);
        rendererRef.current.addTile(tile);

        // Draw the scene
        rendererRef.current.drawScene();
      }
    }
  }, [elevation, location, pathFinderUrl, position, tileServerUrl]);

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

        if (rendererRef.current !== null) {
          rendererRef.current.updateLookAt(xOffset * 0.1, yOffset * 0.1);
        }

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
