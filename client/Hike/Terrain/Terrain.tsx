/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  useEffect, useRef, useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import { ProgressBar } from 'react-bootstrap';
import { LatLng } from '../../state/Types';
import TerrainRenderer from './TerrainRenderer';
import styles from './Terrain.module.css';
import { PhotoInterface } from '../../welcome/state/Types';

type PropsType = {
  photoUrl: string,
  photo: null | PhotoInterface,
  editPhoto: boolean,
  position: LatLng,
  tileServerUrl: string,
  onClose: () => void,
}

const Terrain: React.FC<PropsType> = observer(({
  photoUrl,
  photo,
  editPhoto,
  position,
  tileServerUrl,
  onClose,
}) => {
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number, y: number} | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [photoAlpha, setPhotoAlpha] = useState<number>(editPhoto ? 50 : 0);
  const [scale, setScale] = useState<number>(1);

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
          gl, position, photoUrl, photo, editPhoto, tileServerUrl, setFps, setPercentComplete,
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
  }, [editPhoto, photo, photoUrl, position, tileServerUrl]);

  const handleCenterClick = () => {
    const renderer = rendererRef.current;

    if (renderer) {
      renderer.centerPhoto();
    }
  };

  const handleSaveClick = () => {
    photo?.save();
  };

  const getFloat = (v: string) => {
    if (v.match(/^[+-]?\d+(\.\d+)?$/)) {
      return parseFloat(v);
    }

    return Number.NaN;
  };

  const handleOffsetChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setOffset(value, null, null);
    }
  };

  const handleXRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(value, null, null);
    }
  };

  const handleYRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(null, value, null);
    }
  };

  const handleZRotationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setRotation(null, null, value);
    }
  };

  const handleXTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(value, null, null);
    }
  };

  const handleYTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(null, value, null);
    }
  };

  const handleZTranslationChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = getFloat(event.target.value);
    if (!Number.isNaN(value)) {
      photo?.setTranslation(null, value, null);
    }
  };

  const handleTransparencyChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const renderer = rendererRef.current;

    if (renderer) {
      const value = getFloat(event.target.value);
      if (!Number.isNaN(value)) {
        setPhotoAlpha(value);

        const alpha = value / 100;
        renderer.setPhotoAlpha(alpha);
      }
    }
  };

  const handleScaleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    console.log(`scale = ${event.target.value}`);

    const renderer = rendererRef.current;

    if (renderer) {
      const value = parseFloat(event.target.value);
      if (!Number.isNaN(value)) {
        setScale(value);

        renderer.setScale(value);
      }
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
        const yOffset = -(event.clientY - mouseRef.current.y);
        const sensitivity = 0.1;

        const renderer = rendererRef.current;
        if (renderer !== null) {
          renderer.updateLookAt(xOffset * sensitivity, yOffset * sensitivity);
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
        case 'E':
        case 'e':
          renderer.setVelocity(1, null, null);
          break;

        case 'D':
        case 'd':
          renderer.setVelocity(-1, null, null);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(null, 1, null);
          break;

        case 'F':
        case 'f':
          renderer.setVelocity(null, -1, null);
          break;

        case 'PageUp':
          // renderer.setVelocity(null, null, 1);
          renderer.updateLookAt(0, 1);
          break;

        case 'PageDown':
          // renderer.setVelocity(null, null, -1);
          renderer.updateLookAt(0, -1);
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
        case 'E':
        case 'e':
          renderer.setVelocity(0, null, null);
          break;

        case 'D':
        case 'd':
          renderer.setVelocity(0, null, null);
          break;

        case 'F':
        case 'f':
          renderer.setVelocity(null, 0, null);
          break;

        case 'S':
        case 's':
          renderer.setVelocity(null, 0, null);
          break;

        case 'PageUp':
          renderer.setVelocity(null, null, 0);
          break;

        case 'PageDown':
          renderer.setVelocity(null, null, 0);
          break;

        default:
          break;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const opacitySlider = (style = '') => (
    <label className={style}>
      Opacity
      <input type="range" className={styles.slider} onChange={handleTransparencyChange} min={0} max={100} value={photoAlpha.toFixed(2)} />
    </label>
  );

  return (
    <div className={styles.terrain}>
      {
        percentComplete === 1
          ? <div className={styles.frameRate}>{`${fps.toFixed(2)} fps`}</div>
          : (
            <div className={styles.progressBar}>
              <ProgressBar now={percentComplete} max={1} label={`${(percentComplete * 100).toFixed(2)}%`} />
            </div>
          )
      }
      <div className={styles.upperRight}>
        <div className={`${styles.button} ${styles.right}`} onClick={onClose}>X</div>
        {
          photo && editPhoto
            ? (
              <div className={styles.controls}>
                <div className={styles.button} onClick={handleCenterClick}>Center</div>
                <label className={styles.labeledInput}>
                  Offset
                  <input type="text" onChange={handleOffsetChange} value={photo.offset[0].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  X Rotation
                  <input type="text" onChange={handleXRotationChange} value={photo.xRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Y Rotation
                  <input type="text" onChange={handleYRotationChange} value={photo.yRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Z Rotation
                  <input type="text" onChange={handleZRotationChange} value={photo.zRotation.toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  X Translation
                  <input type="text" onChange={handleXTranslationChange} value={photo.translation[0].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Y Translation
                  <input type="text" onChange={handleYTranslationChange} value={photo.translation[1].toFixed(2)} />
                </label>
                <label className={styles.labeledInput}>
                  Z Translation
                  <input type="text" onChange={handleZTranslationChange} value={photo.translation[2].toFixed(2)} />
                </label>
                <div className={styles.button} onClick={handleSaveClick}>Save</div>
              </div>
            )
            : null
          }
      </div>
      {
        opacitySlider(`${styles.bottomCenter}`)
      }
      <canvas
        ref={canvasRef}
        className={styles.canvas}
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
});

export default Terrain;
