/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  ReactElement, useEffect, useRef, useState,
} from 'react';
import { LatLng } from '../../state/Types';
import TerrainRenderer from './TerrainRenderer';
import styles from './Terrain.module.css';
import Frame from './Frame';

type PropsType = {
  photoUrl: string,
  photoId: null | number,
  editPhoto: boolean,
  position: LatLng,
  tileServerUrl: string,
  onClose: () => void,
}

const Terrain = ({
  photoUrl,
  photoId,
  editPhoto,
  position,
  tileServerUrl,
  onClose,
}: PropsType): ReactElement => {
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [photo, setPhoto] = useState<Frame | null>(null);

  const handlePhotoFound = (frame: Frame) => {
    setPhoto(frame);
  };

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
          gl, position, photoUrl, photoId, tileServerUrl, setFps, setPercentComplete,
          handlePhotoFound,
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
  }, [photoUrl, tileServerUrl, position, photoId]);

  const handleCenterClick = () => {
    const renderer = rendererRef.current;

    if (renderer) {
      renderer.centerPhoto();
    }
  };

  const handleOffsetChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    photo?.setTranslation(parseFloat(event.target.value), null, null);
  };

  const handleXRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (photo) {
      photo.setRotation(parseFloat(event.target.value), null, null);
    }
  };

  const handleYRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (photo) {
      photo.setRotation(null, parseFloat(event.target.value), null);
    }
  };

  const handleZRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (photo) {
      photo.setRotation(null, null, parseFloat(event.target.value));
    }
  };

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
        case 'W':
        case 'w':
          renderer.setVelocity(0.1);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(-0.1);
          break;

        case 'ArrowLeft':
          renderer.setVelocity(0);
          break;

        case 'ArrowRight':
          renderer.setVelocity(0);
          break;

        case 'PageUp':
          renderer.setUpVelocity(1);
          break;

        case 'PageDown':
          renderer.setUpVelocity(-1);
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
      switch (event.key) {
        case 'W':
        case 'w':
          renderer.setVelocity(0);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(0);
          break;

        case 'ArrowLeft':
          renderer.setVelocity(0);
          break;

        case 'ArrowRight':
          renderer.setVelocity(0);
          break;

        case 'PageUp':
          renderer.setUpVelocity(0);
          break;

        case 'PageDown':
          renderer.setUpVelocity(0);
          break;

        default:
          break;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className={styles.terrain}>
      {
        percentComplete === 1
          ? <div className={styles.frameRate}>{`${fps.toFixed(2)} fps`}</div>
          : <div className={styles.loading}>{`Loading: ${(percentComplete * 100).toFixed(1)}% complete`}</div>
      }
      <div className={styles.controls}>
        <div className={styles.button} onClick={onClose}>X</div>
        {
          photo && editPhoto
            ? (
              <>
                <div className={styles.button} onClick={handleCenterClick}>Center</div>
                <label>
                  Offset
                  <input type="text" onChange={handleOffsetChange} defaultValue={photo.translation[0]} />
                </label>
                <label>
                  X Rotation
                  <input type="text" onChange={handleXRotationChange} defaultValue={photo.xRotation} />
                </label>
                <label>
                  Y Rotation
                  <input type="text" onChange={handleYRotationChange} defaultValue={photo.yRotation} />
                </label>
                <label>
                  Z Rotation
                  <input type="text" onChange={handleZRotationChange} defaultValue={photo.zRotation} />
                </label>
              </>
            )
            : null
        }
      </div>
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
    </div>
  );
};

export default Terrain;
