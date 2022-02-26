import { useFormikContext } from 'formik';
import React from 'react';
import styles from './SubmitButton.module.css';

const SubmitButton: React.FC = () => {
  const { isSubmitting } = useFormikContext();

  return (
    <button type="submit" disabled={isSubmitting} className={styles.button}>Post</button>
  );
};

export default SubmitButton;
