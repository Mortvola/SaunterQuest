import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal from '../Modal';
import { showLocationPopup } from '../redux/actions';

const GotoLocationDialog = ({
  show,
  onHide,
  map,
  dispatch,
}) => {
  const handleGoClick = async (vals) => {
    map.panTo(vals);
    dispatch(showLocationPopup({ lat: parseFloat(vals.lat), lng: parseFloat(vals.lng) }));
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} role="dialog">
      <Formik
        initialValues={{
          lat: '',
          lng: '',
        }}
        onSubmit={handleGoClick}
      >
        <Form>
          <Modal.Header closeButton>
            Goto Location
          </Modal.Header>
          <Modal.Body>
            <label>
              Lat:
              <Field name="lat" />
            </label>
            <label>
              Lng:
              <Field name="lng" />
            </label>
            <br />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit">Go</Button>
          </Modal.Footer>
        </Form>
      </Formik>
    </Modal>
  );
};

GotoLocationDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  map: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

const useGotoLocationDialog = () => (
  useModal(GotoLocationDialog)
);

export default GotoLocationDialog;
export { useGotoLocationDialog };
