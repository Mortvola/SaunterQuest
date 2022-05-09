import { observer } from 'mobx-react-lite';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import UploadFileButton from '../../UploadFileButton';
import { BlogPhotoInterface } from '../../Blog/state/Types';
import styles from './Photo.module.css';
import PhotoSelector from './PhotoSelector';
import PleaseWait from '../../Hikes/PleaseWait';
import Image from '../../Image/Image';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = observer(({ photo, blogId }) => {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [uploading, setUploading] = React.useState<boolean>(false);

  const handleFileSelection: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setUploading(true);

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

        photo.setId(body.id);
      }

      setUploading(false);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    photo.setCaption(event.target.value);
  };

  const handleSelectPhotoClick = () => {
    setShowModal(true);
  };

  const handleHide = () => {
    setShowModal(false);
  };

  const handleSelect = (id: number) => {
    photo.setId(id);
    setShowModal(false);
  };

  return (
    <div className={styles.wrapper}>
      <UploadFileButton
        onFileSelection={handleFileSelection}
        label="Upload Photo"
        accept="image/heic,image/tiff,image/x-adobe-dng,image/jpeg"
      />
      <button type="button" onClick={handleSelectPhotoClick}>Select Photo</button>
      <div className={styles.photoWrapper}>
        {
          photo.id
            ? (
              <>
                <Image blogId={blogId} photo={photo} />
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
