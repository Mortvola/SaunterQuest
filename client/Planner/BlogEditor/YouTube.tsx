import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import styles from './YouTube.module.css';

type PropsType = {
  url: string | null,
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
}

const YouTube: React.FC<PropsType> = ({ url, onChange }) => (
  <TextareaAutosize className={styles.text} value={url ?? ''} onChange={onChange} />
);

export default YouTube;
