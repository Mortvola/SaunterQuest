import React from 'react';
import { BlogPhotoInterface } from './state/Types';
import styles from './Photo.module.css';
import PleaseWait from '../Hikes/PleaseWait';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
  className?: string,
  loading?: 'eager' | 'lazy',
}

const Photo: React.FC<PropsType> = ({ photo, blogId, className = '', loading = 'lazy' }) => {
  const [imageLoading, setImageLoading] = React.useState<boolean>(true);
  
  const handleLoaded = () => {
    setImageLoading(false);
  };

  return (
    <div className={`${className} ${styles.frame}`}>
      {
        photo.id
          ? (
            <>
              <div className={styles.imageWrapper}>
                <img
                  className={styles.image}
                  src={`/api/blog/${blogId}/photo/${photo.id}`}
                  alt=""
                  style={{ transform: `rotate(${photo.orientation}deg)` }}
                  loading={loading}
                  onLoad={handleLoaded}
                />
                <PleaseWait show={imageLoading} />
              </div>
              {
                photo.caption
                  ? <div className={styles.caption}>{photo.caption}</div>
                  : null
              }
            </>
          )
          : null
      }
    </div>
  );
};

export default Photo;
