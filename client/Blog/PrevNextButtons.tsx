import React from 'react';
import styles from './PrevNextButtons.module.css';
import { BlogInterface } from './state/Types';

type PropsType = {
  blog: BlogInterface,
};

const PrevNextButtons: React.FC<PropsType> = ({ blog }) => {
  const handlePrevClick = () => {
    if (blog.prevPostId !== null) {
      window.location.replace(`/blog/${blog.prevPostId}`);
    }
  };

  const handleNextClick = () => {
    if (blog.nextPostId !== null) {
      window.location.replace(`/blog/${blog.nextPostId}`);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.button} ${blog.prevPostId === null ? styles.disabled : ''}`}
        onClick={handlePrevClick}
      >
        Previous Post
      </div>
      <div
        className={`${styles.button} ${blog.nextPostId === null ? styles.disabled : ''}`}
        onClick={handleNextClick}
      >
        Next Post
      </div>
    </div>
  );
};

export default PrevNextButtons;
