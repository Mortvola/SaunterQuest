import React from 'react';
import { BlogPhotoInterface } from './state/Types';
import styles from './Photo.module.css';
import Image from '../Image/Image';

type PropsType = {
  photo: BlogPhotoInterface | null,
  blogId: number,
  className?: string,
}

const Photo: React.FC<PropsType> = ({
  photo,
  blogId,
  className = '',
}) => (
  <div className={`${className} ${styles.frame}`}>
    {
      photo
        ? (
          <>
            <div className={styles.imageWrapper}>
              <Image
                blogId={blogId}
                photoId={photo.id}
                width={photo.width}
                height={photo.height}
              />
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

export default Photo;
