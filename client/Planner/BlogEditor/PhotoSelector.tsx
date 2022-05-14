/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import Http from '@mortvola/http';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { BlogPhotoProps } from '../../../common/ResponseTypes';
import styles from './PhotoSelector.module.css';

type PropsType = {
  show: boolean,
  onHide: () => void,
  onSelect: (id: number, width?: number | null, height?: number | null) => void,
}

const PhotoSelector: React.FC<PropsType> = ({ show, onHide, onSelect }) => {
  const [photos, setPhotos] = React.useState<BlogPhotoProps[]>([]);

  React.useEffect(() => {
    (async () => {
      const response = await Http.get<BlogPhotoProps[]>('/api/photos');

      if (response.ok) {
        setPhotos(await response.body());
      }
    })();
  }, []);

  return (
    <Modal show={show} onHide={onHide} scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Select Photo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          photos.map((p) => (
            <img
              className={styles.photo}
              key={p.id}
              src={`/api/photo/${p.id}`}
              alt=""
              onClick={() => onSelect(p.id, p.width, p.height)}
            />
          ))
        }
      </Modal.Body>
    </Modal>
  );
};

export default PhotoSelector;
