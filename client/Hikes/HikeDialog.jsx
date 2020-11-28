import React, { useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import MobxStore from '../redux/store';
import Hike from '../redux/Hike';
import { VIEW_HIKE } from '../menuEvents';

const HikeDialog = ({
  show,
  onHide,
}) => {
  const { uiState, hikeManager } = useContext(MobxStore);
  const formRef = useRef(null);

  const insertHike = async () => {
    const formData = new FormData(formRef.current);

    const hike = await hikeManager.addHike(formData);
    uiState.hike = hike;
    uiState.setView(VIEW_HIKE);
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

HikeDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

export default HikeDialog;
