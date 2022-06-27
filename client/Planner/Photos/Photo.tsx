import React from 'react';
import Http from '@mortvola/http';
import IconButton from '../../IconButton';
import { useConfirmation } from '../../Confirmation';
import styles from './Photo.module.css';
import PleaseWait from '../../Hikes/PleaseWait';
import Image from '../../Image/Image';
import { BlogPhotoProps } from '../../../common/ResponseTypes';

type PropsType = {
  photo: BlogPhotoProps,
  onDelete: (id: number) => void,
}

const Photo: React.FC<PropsType> = ({ photo, onDelete }) => {
  const [regenerating, setRegenerating] = React.useState<boolean>(false);
  const [version, setVersion] = React.useState<number>(0);
  const [DeleteConfirmation, handleDeleteClick] = useConfirmation(
    'Delete',
    'Are you sure you want to delete this photo?',
    () => {
      onDelete(photo.id);
    },
  );

  const handleUpdateClick = async () => {
    setRegenerating(true);

    try {
      await Http.post(`/api/photo/${photo.id}`, { command: 'regenerate' });
    }
    catch (error) {
      console.log(error);
    }

    setRegenerating(false);
  };

  const handleRotateClick = async (command: string) => {
    setRegenerating(true);

    await Http.post(`/api/photo/${photo.id}`, { command });

    setVersion((prev) => prev + 1);
    setRegenerating(false);
  };

  const handleRotateRightClick = async () => {
    handleRotateClick('rotate-right');
  };

  const handleRotateLeftClick = async () => {
    handleRotateClick('rotate-left');
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
        <Image
          photoId={photo.id}
          version={version}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
        />
        <PleaseWait show={regenerating} />
      </div>
      <DeleteConfirmation />
    </div>
  );
};

export default Photo;
