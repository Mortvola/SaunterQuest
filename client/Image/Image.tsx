import React from 'react';
import styles from './Image.module.css';

type PropsType = {
  blogId?: number,
  photoId: number,
  loading?: 'eager' | 'lazy',
  version?: number,
};

const Image: React.FC<PropsType> = ({
  blogId,
  photoId,
  loading = 'lazy',
  version = 0,
}) => {
  const [photoSize, setPhotoSize] = React.useState<boolean>(false);

  const handleLoaded = () => {
    setPhotoSize(true);
  };

  return (
    <img
      className={styles.image}
      src={
        blogId === undefined
          ? `/api/photo/${photoId}?v=${version}${!photoSize ? '&size=thumb' : ''}`
          : `/api/blog/${blogId}/photo/${photoId}?v=${version}${!photoSize ? '&size=thumb' : ''}`
      }
      alt=""
      loading={loading}
      onLoad={handleLoaded}
    />
  );
};

export default Image;
