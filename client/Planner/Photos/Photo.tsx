import React from 'react';
import Http from '@mortvola/http';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import styles from './Photo.module.css';
import PleaseWait from '../../Hikes/PleaseWait';
import Image from '../../Image/Image';

type PropsType = {
  id: number,
  onDelete: (id: number) => void,
}

const Photo: React.FC<PropsType> = ({ id, onDelete }) => {
  const [regenerating, setRegenerating] = React.useState<boolean>(false);
  const [version, setVersion] = React.useState<number>(0);
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
      console.log(error);
    }

    setRegenerating(false);
  };

  const handleRotateRightClick = async () => {
    setRegenerating(true);

    await Http.post(`/api/photo/${id}`, { command: 'rotate-right' });

    setVersion((prev) => prev + 1);
    setRegenerating(false);
  };

  const handleRotateLeftClick = async () => {
    setRegenerating(true);

    await Http.post(`/api/photo/${id}`, { command: 'rotate-left' });

    setVersion((prev) => prev + 1);
    setRegenerating(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <IconButton icon="trash" invert onClick={handleDeleteClick} />
        <IconButton icon="rotate-right" iconClass="fa-solid" invert onClick={handleRotateRightClick} />
        <IconButton icon="rotate-left" iconClass="fa-solid" invert onClick={handleRotateLeftClick} />
        <IconButton icon="pencil" iconClass="fa-solid" invert onClick={handleUpdateClick} />
      </div>
      <div className={styles.photoWrapper}>
        <Image photoId={id} version={version} />
        <PleaseWait show={regenerating} />
      </div>
      <DeleteConfirmation />
    </div>
  );
};

export default Photo;
