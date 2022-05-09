import React, { ReactElement } from 'react';
import styles from './UploadFileButton.module.css';

type PropsType = {
  onFileSelection: React.ChangeEventHandler<HTMLInputElement>,
  multiple?: boolean,
  accept?: string,
  label?: string,
}

const UploadFileButton = ({
  onFileSelection,
  multiple,
  accept,
  label,
}: PropsType): ReactElement => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    const inputElement = inputRef.current;

    if (inputElement) {
      inputElement.click();
    }
  };

  return (
    <div className={styles.wrapper}>
      <button type="button" onClick={handleClick}>{label}</button>
      <input
        ref={inputRef}
        type="file"
        className={styles.input}
        accept={accept}
        multiple={multiple}
        onChange={onFileSelection}
      />
    </div>
  );
};

export default UploadFileButton;
