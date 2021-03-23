/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useRef, ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { useStores } from '../state/store';
import { VIEW_HIKE } from '../menuEvents';
import useModal, { ModalProps } from '../useModal';

const HikeDialog = ({
  show,
  onHide,
}: ModalProps): ReactElement => {
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
    uiState.setView(VIEW_HIKE);

    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} role="dialog">
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
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={insertHike}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
};

// HikeDialog.propTypes = {
//   show: PropTypes.bool.isRequired,
//   onHide: PropTypes.func.isRequired,
// };

export const useHikeDialog = (): [
  () => (ReactElement | null),
  () => void,
] => useModal(HikeDialog);

export default HikeDialog;
