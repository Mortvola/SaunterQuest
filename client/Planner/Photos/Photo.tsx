import React from 'react';
import IconButton from '../../IconButton';
import styles from './Photo.module.css';

type PropsType = {
  id: number,
}

const Photo: React.FC<PropsType> = ({ id }) => (
  <div className={styles.wrapper}>
    <img
      className={styles.photo}
      src={`/api/photo/${id}`}
      alt=""
    />
    <IconButton icon="trash" invert />
  </div>
);

export default Photo;
