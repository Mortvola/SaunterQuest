import React, { ReactElement } from 'react';

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
  <label htmlFor="fileupload" className="btn btn-primary">
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

UploadFileButton.defaultProps = {
  multiple: false,
  accept: '*',
  label: '',
};

export default UploadFileButton;
