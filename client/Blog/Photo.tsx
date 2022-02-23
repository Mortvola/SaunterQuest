import Http from '@mortvola/http';
import { observer } from 'mobx-react-lite';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import UploadFileButton from '../Hike/UploadFileButton';
import { BlogPhotoInterface } from '../state/Types';
import styles from './Photo.module.css';
import PhotoSelector from './PhotoSelector';

type PropsType = {
  photo: BlogPhotoInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = observer(({ photo, blogId }) => {
  const [showModal, setShowModal] = React.useState<boolean>(false);

  const handleFileSelection: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const toBinaryString = (bytes: Uint8Array) => {
      let result = '';
      for (let i = 0; i < bytes.length; i += 1) {
        result += String.fromCharCode(bytes[i]);
      }

      return result;
    };

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && e.target.result !== null && typeof e.target.result !== 'string') {
          const tmp = new Uint8Array(e.target.result);
          const encodedPicture = btoa(toBinaryString(tmp));

          const response = await Http.post<{ data: string }, { id: number }>('/api/photo', {
            data: encodedPicture,
          });

          if (response.ok) {
            const body = await response.body();
            photo.setId(body.id);
          }
        }
      };

      reader.readAsArrayBuffer(file);
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
    <>
      <UploadFileButton
        onFileSelection={handleFileSelection}
        label="Upload Photo"
      />
      <button type="button" onClick={handleSelectPhotoClick}>Select Photo</button>
      <div className={styles.photoWrapper}>
        {
          photo.id
            ? (
              <>
                <img
                  className={styles.image}
                  src={`/api/blog/${blogId}/photo/${photo.id}`}
                  alt=""
                />
                <TextareaAutosize className={styles.text} value={photo.caption ?? ''} onChange={handleChange} />
              </>
            )
            : null
        }
      </div>
      <PhotoSelector show={showModal} onHide={handleHide} onSelect={handleSelect} />
    </>
  );
});

export default Photo;
