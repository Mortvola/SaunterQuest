import React, { FC } from 'react';
import styles from './PleaseWait.module.css';

type PropsType = {
  show: boolean;
}

const PleaseWait: FC<PropsType> = ({
  show,
}) => {
  if (show) {
    return (
      <div className={styles.mapPleaseWait}>
        <div className={styles.mapPleaseWaitSpinner} />
      </div>
    );
  }

  return null;
};

export default PleaseWait;
