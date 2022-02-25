import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import styles from './HTML.module.css';

type PropsType = {
  html: string | null,
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
}

const HTML: React.FC<PropsType> = ({ html, onChange }) => (
  <TextareaAutosize className={styles.text} value={html ?? ''} onChange={onChange} />
);

export default HTML;
