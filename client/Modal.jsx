import React, { useState } from 'react';

const useModal = (
  Dialog,
  onSave,
) => {
  const [show, setShow] = useState(false);

  const handleHide = () => {
    setShow(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }

    handleHide();
  };

  const createDialog = ({ ...props }) => (
    <Dialog
      {...props}
      show={show}
      onHide={handleHide}
      onConfirm={handleSave}
    />
  );

  return [
    createDialog,
    () => setShow(true),
  ];
};

export default useModal;
