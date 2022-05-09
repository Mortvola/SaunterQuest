import React from 'react';
import { BlogPhotoInterface } from './state/Types';
import styles from './Photo.module.css';
import PleaseWait from '../Hikes/PleaseWait';
import Image from '../Image/Image';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
  className?: string,
  loading?: 'eager' | 'lazy',
}

const Photo: React.FC<PropsType> = ({
  photo,
  blogId,
  className = '',
  loading = 'lazy',
}) => {
  const [photoSize, setPhotoSize] = React.useState<boolean>(false);

  const handleLoaded = () => {
    setPhotoSize(true);
  };

  return (
    <div className={`${className} ${styles.frame}`}>
      {
        photo.id
          ? (
            <>
              <div className={styles.imageWrapper}>
                <Image blogId={blogId} photo={photo} />
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
