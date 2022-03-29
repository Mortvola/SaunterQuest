import Http from '@mortvola/http';
import { observer } from 'mobx-react-lite';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import UploadFileButton from '../../UploadFileButton';
import { BlogPhotoInterface } from '../../Blog/state/Types';
import styles from './Photo.module.css';
import PhotoSelector from './PhotoSelector';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = observer(({ photo, blogId }) => {
  const [showModal, setShowModal] = React.useState<boolean>(false);

  const handleFileSelection: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
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

  const handleOrientationChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    photo.setOrientation(parseInt(event.target.value, 10));
  }

  return (
    <div>
      <UploadFileButton
        onFileSelection={handleFileSelection}
        label="Upload Photo"
      />
      <button type="button" onClick={handleSelectPhotoClick}>Select Photo</button>
      <select value={photo.orientation} onChange={handleOrientationChange}>
        <option value={0}>0 degrees</option>
        <option value={90}>90 degrees</option>
        <option value={180}>180 degrees</option>
        <option value={270}>270 degrees</option>
      </select>
      <div className={styles.photoWrapper}>
        {
          photo.id
            ? (
              <>
                <img
                  className={styles.image}
                  src={`/api/blog/${blogId}/photo/${photo.id}`}
                  alt=""
                  style={{ transform: `rotate(${photo.orientation}deg)` }}
                />
                <TextareaAutosize className={styles.text} value={photo.caption ?? ''} onChange={handleChange} />
              </>
            )
            : null
        }
      </div>
      <PhotoSelector show={showModal} onHide={handleHide} onSelect={handleSelect} />
    </div>
  );
});

export default Photo;
