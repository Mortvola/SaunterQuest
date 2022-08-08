import React from 'react';
import styles from './ScrollWrapper.module.css';

type PropTypes = {
  children?: React.ReactNode;
  onScroll?: (scrollTop: number) => void,
}

const ScrollWrapper: React.FC<PropTypes> = ({ children, onScroll }) => {
  const handleScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    if (onScroll) {
      onScroll(event.currentTarget.scrollTop);
    }
  };

  return (
    <div className={styles.blogWrapper} onScroll={handleScroll}>
      {
        children
      }
    </div>
  );
};

export default ScrollWrapper;
