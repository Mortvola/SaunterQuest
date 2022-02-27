import React from 'react';
import styles from './YouTube.module.css';

type PropsType = {
  width: number,
  height: number,
  url: string | null,
}

const YouTube: React.FC<PropsType> = ({ width, height, url }) => (
  url
    ? (
      <iframe
        className={styles.youTube}
        width={width}
        height={height}
        src={url}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
    : null
);

export default YouTube;
