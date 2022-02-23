import React from 'react';
import { BlogPhotoInterface } from '../../state/Types';
import styles from './Photo.module.css';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = ({ photo, blogId }) => (
  <div className={styles.frame}>
    {
      photo.id
        ? (
          <>
            <img
              className={styles.image}
              src={`/api/blog/${blogId}/photo/${photo.id}`}
              alt=""
            />
            <div className={styles.caption}>{photo.caption}</div>
          </>
        )
        : null
    }
  </div>
);

export default Photo;
