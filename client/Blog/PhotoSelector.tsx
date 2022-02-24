/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import Http from '@mortvola/http';
import React from 'react';
import { Modal } from 'react-bootstrap';
import styles from './PhotoSelector.module.css';

type PropsType = {
  show: boolean,
  onHide: () => void,
  onSelect: (id: number) => void,
}

const PhotoSelector: React.FC<PropsType> = ({ show, onHide, onSelect }) => {
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
    <Modal show={show} onHide={onHide} scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Select Photo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          photos.map((p) => (
            <img
              className={styles.photo}
              key={p}
              src={`/api/photo/${p}`}
              alt=""
              onClick={() => onSelect(p)}
            />
          ))
        }
      </Modal.Body>
    </Modal>
  );
};

export default PhotoSelector;