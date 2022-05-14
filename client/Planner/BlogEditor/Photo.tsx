import { observer } from 'mobx-react-lite';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Http from '@mortvola/http';
import UploadFileButton from '../../UploadFileButton';
import { BlogPhotoInterface } from '../../Blog/state/Types';
import styles from './Photo.module.css';
import PhotoSelector from './PhotoSelector';
import PleaseWait from '../../Hikes/PleaseWait';
import Image from '../../Image/Image';
import IconButton from '../../IconButton';

type PropsType = {
  photo: BlogPhotoInterface | null,
  blogId: number,
}

const Photo: React.FC<PropsType> = observer(({ photo, blogId }) => {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [uploadFailed, setUploadFailure] = React.useState<boolean>(false);
  const [version, setVersion] = React.useState<number>(0);

  const handleFileSelection: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setUploading(true);
      setUploadFailure(false);

      const response = await fetch('/api/photo', {
        method: 'POST',
        headers: new Headers({
          Accept: 'application/json',
          'Content-Type': event.target.files[0].type,
        }),
        body: event.target.files[0],
      });

      if (response.ok) {
        const body = await response.json();

        photo?.setInfo(body.id, body.width, body.height);
      }
      else {
        setUploadFailure(true);
      }

      setUploading(false);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    photo?.setCaption(event.target.value);
  };

  const handleSelectPhotoClick = () => {
    setShowModal(true);
  };

  const handleHide = () => {
    setShowModal(false);
  };

  const handleSelect = (id: number) => {
    photo?.setInfo(id);
    setShowModal(false);
  };

  const handleRotate = async (command: string) => {
    if (photo === null) {
      throw new Error('photo is null');
    }

    setUploading(true);

    const response = await Http.post<
      { command: string },
      { id: number, width?: number, height?: number }
    >(`/api/photo/${photo.id}`, { command });

    if (response.ok) {
      const body = await response.body();

      photo.setInfo(body.id, body.width, body.height);

      setVersion((prev) => prev + 1);
      setUploading(false);
    }
  };

  const handleRotateRightClick = async () => {
    handleRotate('rotate-right');
  };

  const handleRotateLeftClick = async () => {
    handleRotate('rotate-left');
  };

  return (
    <div className={styles.wrapper}>
      <UploadFileButton
        onFileSelection={handleFileSelection}
        label="Upload Photo"
        accept="image/heic,image/tiff,image/x-adobe-dng,image/jpeg"
      />
      <button type="button" onClick={handleSelectPhotoClick}>Select Photo</button>
      {
        uploadFailed
          ? <div>Upload failed</div>
          : null
      }
      <div className={styles.photoWrapper}>
        {
          photo
            ? (
              <>
                <IconButton icon="rotate-right" iconClass="fa-solid" onClick={handleRotateRightClick} />
                <IconButton icon="rotate-left" iconClass="fa-solid" onClick={handleRotateLeftClick} />
                <Image
                  blogId={blogId}
                  photoId={photo.id}
                  version={version}
                  width={photo.width}
                  height={photo.height}
                />
                <TextareaAutosize className={styles.text} value={photo.caption ?? ''} onChange={handleChange} />
              </>
            )
            : null
        }
      </div>
      <PhotoSelector show={showModal} onHide={handleHide} onSelect={handleSelect} />
      <PleaseWait show={uploading} />
    </div>
  );
});

export default Photo;
