import React from 'react';
import Http from '@mortvola/http';
import { Alert, Modal, ModalHeader } from 'react-bootstrap';
import styles from './Photos.module.css';
import Photo from './Photo';
import { BlogPhotoProps } from '../../../common/ResponseTypes';

const Photos: React.FC = () => {
  const [photos, setPhotos] = React.useState<BlogPhotoProps[]>([]);
  const [showError, setShowError] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      const response = await Http.get<BlogPhotoProps[]>('/api/photos');

      if (response.ok) {
        setPhotos(await response.body());
      }
    })();
  }, []);

  const handleDelete = async (id: number) => {
    const index = photos.findIndex((p) => p.id === id);

    if (index !== -1) {
      const response = await Http.delete(`/api/photo/${id}`);

      if (response.ok) {
        setPhotos([
          ...photos.slice(0, index),
          ...photos.slice(index + 1),
        ]);
      }
      else if (response.status === 405) {
        setShowError(true);
      }
    }
  };

  return (
    <div className={styles.list}>
      {
        photos.map((p) => (
          <Photo key={p.id} photo={p} onDelete={handleDelete} />
        ))
      }
      <Modal show={showError} onHide={() => setShowError(false)} backdrop="static">
        <ModalHeader closeButton>
          Delete Error
        </ModalHeader>
        <Alert variant="danger">
          The photo is currently in use.
        </Alert>
      </Modal>
    </div>
  );
};

export default Photos;
