import React, {
  ReactElement, useEffect, useRef,
} from 'react';
import { LatLng } from '../../state/Types';
import TerrainRenderer from './TerrainRenderer';

export type Location = {
  x: number,
  y: number,
  zoom: number,
};

type PropsType = {
  position: LatLng,
  tileServerUrl: string,
  pathFinderUrl: string,
  onFpsChange: (fps: number) => void,
  onLoadChange: (percentComplete: number) => void,
}

const Terrain = ({
  position,
  tileServerUrl,
  pathFinderUrl,
  onFpsChange,
  onLoadChange,
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
        rendererRef.current = new TerrainRenderer(
          gl, position, tileServerUrl, pathFinderUrl, onFpsChange, onLoadChange,
        );

        rendererRef.current.start();
      }
    }

    const renderer = rendererRef.current;
    return () => {
      if (renderer) {
        renderer.stop();
      }
    };
  }, [pathFinderUrl, position, tileServerUrl]);

  const handlePointerDown: React.PointerEventHandler<HTMLCanvasElement> = (
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

    if (canvasRef.current) {
      canvasRef.current.focus();
    }

    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerMove: React.PointerEventHandler = (event) => {
    if (mouseRef.current) {
      const canvas = canvasRef.current;

      if (canvas) {
        const xOffset = event.clientX - mouseRef.current.x;
        const yOffset = event.clientY - mouseRef.current.y;

        const renderer = rendererRef.current;
        if (renderer !== null) {
          renderer.updateLookAt(xOffset * 0.1, yOffset * 0.1);
        }

        mouseRef.current = { x: event.clientX, y: event.clientY };

        event.stopPropagation();
        event.preventDefault();
      }
    }
  };

  const handlePointerUp: React.MouseEventHandler = (event) => {
    mouseRef.current = null;
    event.stopPropagation();
    event.preventDefault();
  };

  const handlePointerCapture: React.MouseEventHandler = (event) => {
    // console.log('got pointer capture');
  };

  const handlePointerRelease: React.MouseEventHandler = (event) => {
    // console.log('released pointer capture');
  };

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    const renderer = rendererRef.current;
    if (renderer) {
      switch (event.key) {
        case 'ArrowUp':
          renderer.setVelocity(1);
          break;

        case 'ArrowDown':
          renderer.setVelocity(-1);
          break;

        case 'ArrowLeft':
          renderer.setVelocity(0);
          break;

        case 'ArrowRight':
          renderer.setVelocity(0);
          break;

        default:
          break;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyUp: React.KeyboardEventHandler = (event) => {
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.setVelocity(0);
    }

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <canvas
      ref={canvasRef}
      style={{
        width: '100%', height: '100%', backgroundColor: '#fff', touchAction: 'none',
      }}
      width="853"
      height="480"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onGotPointerCapture={handlePointerCapture}
      onLostPointerCapture={handlePointerRelease}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    />
  );
};

export default Terrain;
