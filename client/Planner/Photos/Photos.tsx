import React from 'react';
import Http from '@mortvola/http';
import styles from './Photos.module.css';
import Photo from './Photo';

const Photos: React.FC = () => {
  const [photos, setPhotos] = React.useState<number[]>([]);

  React.useEffect(() => {
    (async () => {
      const response = await Http.get<number[]>('/api/photos');

      if (response.ok) {
        setPhotos(await response.body());
      }
    })();
  }, []);

  return (
    <div className={styles.list}>
      {
        photos.map((p) => (
          <Photo key={p} id={p} />
        ))
      }
    </div>
  );
};

export default Photos;
