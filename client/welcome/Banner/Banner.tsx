import React, { useEffect, useRef } from 'react';
import styles from './Banner.module.css';
import BannerRenderer from './BannerRenderer';

const Banner: React.FC = () => {
  const rendererRef = useRef<BannerRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas !== null) {
      // Initialize the GL context
      const gl = canvas.getContext('webgl2');

      if (gl === null) {
        throw new Error('gl is null');
      }

      const maxHeight = document.documentElement.clientHeight; // * 0.60;
      console.log(document.documentElement.clientHeight / document.documentElement.clientWidth);
      if (rendererRef.current === null) {
        rendererRef.current = new BannerRenderer(gl, maxHeight);

        rendererRef.current.start();
      }
    }

    const renderer = rendererRef.current;
    return () => {
      if (renderer) {
        renderer.stop();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.banner}
    />
  );
};

export default Banner;
