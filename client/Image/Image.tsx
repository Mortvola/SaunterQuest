import React from 'react';
import { BlogPhotoInterface } from '../Blog/state/Types';
import styles from './Image.module.css';

type PropsType = {
  blogId: number,
  photo: BlogPhotoInterface,
  loading?: 'eager' | 'lazy',
};

const Image: React.FC<PropsType> = ({ blogId, photo, loading = 'lazy' }) => {
  const [photoSize, setPhotoSize] = React.useState<boolean>(false);

  const handleLoaded = () => {
    setPhotoSize(true);
  };

  return (
    <img
      className={styles.image}
      src={`/api/blog/${blogId}/photo/${photo.id}${!photoSize ? '?size=thumb' : ''}`}
      alt=""
      style={{ transform: `rotate(${photo.orientation}deg)` }}
      loading={loading}
      onLoad={handleLoaded}
    />
  );
};

export default Image;