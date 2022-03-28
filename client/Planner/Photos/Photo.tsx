import React from 'react';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import styles from './Photo.module.css';

type PropsType = {
  id: number,
  onDelete: (id: number) => void,
}

const Photo: React.FC<PropsType> = ({ id, onDelete }) => {
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this photo?',
    () => {
      onDelete(id);
    },
  );

  return (
    <div className={styles.wrapper}>
      <img
        className={styles.photo}
        src={`/api/photo/${id}`}
        alt=""
      />
      <IconButton icon="trash" invert onClick={handleDeleteClick} />
      <DeleteConfirmation />
    </div>
  );
};

export default Photo;
