import React from 'react';
import { BlogSectionInterface } from '../../state/Types';
import styles from './Photo.module.css';

type PropsType = {
  section: BlogSectionInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = ({ section, blogId }) => (
  <div className={styles.frame}>
    <img
      className={styles.image}
      src={`/api/blog/${blogId}/photo/${section.photoId}`}
      alt=""
    />
    <div>{section.text}</div>
  </div>
);

export default Photo;
