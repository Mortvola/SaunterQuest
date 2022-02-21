import React from 'react';
import { BlogSectionInterface } from '../../state/Types';
import styles from './Photo.module.css';

type PropsType = {
  section: BlogSectionInterface,
  blogId: number,
}

const Photo: React.FC<PropsType> = ({ section, blogId }) => (
  <div className={styles.frame}>
    {
      section.photoId
        ? (
          <>
            <img
              className={styles.image}
              src={`/api/blog/${blogId}/photo/${section.photoId}`}
              alt=""
            />
            <div>{section.text}</div>
          </>
        )
        : null
    }
  </div>
);

export default Photo;
