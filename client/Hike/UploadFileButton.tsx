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
}: PropsType): ReactElement => (
  <label htmlFor="fileupload" className={styles.uploadButton}>
    {label}
    <input
      type="file"
      id="fileupload"
      accept={accept}
      multiple={multiple}
      style={{ opacity: 0, width: 0, height: 0 }}
      onChange={onFileSelection}
    />
  </label>
);

export default UploadFileButton;
