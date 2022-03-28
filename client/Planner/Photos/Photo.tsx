import React from 'react';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import styles from './Photo.module.css';
import Http from '@mortvola/http';

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

  const handleUpdateClick = async () => {
    await Http.post(`/api/photo/${id}/regenerate`);
  }

  return (
    <div className={styles.wrapper}>
      <img
        className={styles.photo}
        src={`/api/photo/${id}`}
        alt=""
      />
      <div className={styles.toolbar}>
        <IconButton icon="trash" invert onClick={handleDeleteClick} />
        <IconButton icon="rotate-right" iconClass="fa-solid" invert onClick={handleUpdateClick} />
      </div>
      <DeleteConfirmation />
    </div>
  );
};

export default Photo;
