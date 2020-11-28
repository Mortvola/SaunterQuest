import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal from '../Modal';

const GotoLocationDialog = ({
  show,
  onHide,
  leafletMap,
  hike,
}) => {
  const handleGoClick = async (vals) => {
    leafletMap.panTo(vals);
    hike.map.showLocationPopup({ lat: parseFloat(vals.lat), lng: parseFloat(vals.lng) });
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
  leafletMap: PropTypes.shape().isRequired,
  hike: PropTypes.shape().isRequired,
};

const useGotoLocationDialog = () => (
  useModal(GotoLocationDialog)
);

export default GotoLocationDialog;
export { useGotoLocationDialog };
