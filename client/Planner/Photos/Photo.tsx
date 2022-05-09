import React from 'react';
import Http from '@mortvola/http';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import styles from './Photo.module.css';
import PleaseWait from '../../Hikes/PleaseWait';

type PropsType = {
  id: number,
  onDelete: (id: number) => void,
}

const Photo: React.FC<PropsType> = ({ id, onDelete }) => {
  const [regenerating, setRegenerating] = React.useState<boolean>(false);
  const [imageLoading, setImageLoading] = React.useState<boolean>(true);
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this photo?',
    () => {
      onDelete(id);
    },
  );

  const handleUpdateClick = async () => {
    setRegenerating(true);

    try {
      await Http.post(`/api/photo/${id}`, { command: 'regenerate' });
    }
    catch (error) {
    }

    setRegenerating(false);
  };

  const handleLoaded = () => {
    setImageLoading(false);
  };

  const handleRotateClick = async () => {
    setRegenerating(true);

    await Http.post(`/api/photo/${id}`, { command: 'rotate' });

    setRegenerating(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.photoWrapper}>
        <img
          className={styles.photo}
          src={`/api/photo/${id}`}
          alt=""
          loading="lazy"
          onLoad={handleLoaded}
        />
        <PleaseWait show={regenerating || imageLoading} />
      </div>
      <div className={styles.toolbar}>
        <IconButton icon="trash" invert onClick={handleDeleteClick} />
        <IconButton icon="rotate-right" iconClass="fa-solid" invert onClick={handleRotateClick} />
        <IconButton icon="pencil" iconClass="fa-solid" invert onClick={handleUpdateClick} />
      </div>
      <DeleteConfirmation />
    </div>
  );
};

export default Photo;
