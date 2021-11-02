/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useRef, ReactElement } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { useStores } from '../state/store';

type PropsType = {
}

const HikeDialog = ({
  setShow,
}: PropsType & ModalProps): ReactElement => {
  const { uiState } = useStores();
  const formRef = useRef<HTMLFormElement>(null);

  const insertHike = async () => {
    if (formRef.current === null) {
      throw new Error('ref not set');
    }

    const formData = new FormData(formRef.current);
    const name = formData.get('name');
    if (typeof name !== 'string') {
      throw new Error('name is not valid');
    }

    // const hike = await hikeManager.addHike(name);

    // uiState.hike = hike;
    // uiState.setView(VIEW_HIKE);

    setShow(false);
  };

  return (
    <>
      <Modal.Header closeButton>
        Name Your Hike
      </Modal.Header>
      <Modal.Body>
        <form ref={formRef}>
          <label>Name:</label>
          <input type="text" className="form-control" name="name" />
          <br />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
        <Button variant="primary" onClick={insertHike}>Save</Button>
      </Modal.Footer>
    </>
  );
};

export const useHikeDialog = makeUseModal<PropsType>(HikeDialog);

export default HikeDialog;
