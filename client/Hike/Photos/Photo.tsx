/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from 'react';
import { PhotoInterface } from '../state/Types';
import styles from './Photo.module.css';

type PropsType = {
  blogId: number,
  photo: PhotoInterface,
  onClick: (photo: PhotoInterface) => void,
}

const Photo: React.FC<PropsType> = ({ blogId, photo, onClick }) => {
  const handleClick = () => {
    onClick(photo);
  };

  return (
    <div className={styles.frame}>
      <img
        className={styles.image}
        src={`/api/blog/${blogId}/photo/${photo.id}`}
        alt=""
        onClick={handleClick}
      />
      <div>{photo.caption}</div>
    </div>
  );
};

export default Photo;
