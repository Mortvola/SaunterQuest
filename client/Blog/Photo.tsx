import Http from '@mortvola/http';
import { observer } from 'mobx-react-lite';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import UploadFileButton from '../Hike/UploadFileButton';
import { BlogSectionInterface } from '../state/Types';
import styles from './Photo.module.css';

type PropsType = {
  section: BlogSectionInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = observer(({ section, blogId }) => {
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
            section.setPhoto(body.id);
          }
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    section.setText(event.target.value);
  };

  return (
    <>
      <UploadFileButton
        onFileSelection={handleFileSelection}
        label="Upload Photo"
      />
      <button type="button">Select Photo</button>
      <div className={styles.photoWrapper}>
        {
          section.photoId
            ? (
              <>
                <img
                  className={styles.image}
                  src={`/api/blog/${blogId}/photo/${section.photoId}`}
                  alt=""
                />
                <TextareaAutosize className={styles.text} value={section.text ?? ''} onChange={handleChange} />
              </>
            )
            : null
        }
      </div>
    </>
  );
});

export default Photo;
