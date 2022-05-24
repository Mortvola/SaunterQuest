import React from 'react';
import Http from '@mortvola/http';
import { BlogPhotoProps } from '../../common/ResponseTypes';
import Image from '../Image/Image';
import styles from './Photos.module.css';

const Photos: React.FC = () => {
  const [photos, setPhotos] = React.useState<BlogPhotoProps[]>([]);

  React.useEffect(() => {
    (async () => {
      const response = await Http.get<BlogPhotoProps[]>('/api/blog/photos');

      if (response.ok) {
        const body = await response.body();

        setPhotos(body);
      }
    })();
  }, []);

  return (
    <div className={styles.frame}>
      {
        photos.map((photo) => (
          <Image
            key={photo.id}
            blogId={photo.blogId}
            photoId={photo.id}
            width={photo.width ?? undefined}
            height={photo.height ?? undefined}
          />
        ))
      }
    </div>
  );
};

export default Photos;
