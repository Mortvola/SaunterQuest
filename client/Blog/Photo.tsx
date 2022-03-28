import React from 'react';
import { BlogPhotoInterface } from './state/Types';
import styles from './Photo.module.css';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
  className?: string,
}

const Photo: React.FC<PropsType> = ({ photo, blogId, className = '' }) => (
  <div className={`${className} ${styles.frame}`}>
    {
      photo.id
        ? (
          <>
            <img
              className={styles.image}
              src={`/api/blog/${blogId}/photo/${photo.id}`}
              alt=""
              style={{ transform: `rotate(${photo.orientation}deg)` }}
            />
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

export default Photo;
