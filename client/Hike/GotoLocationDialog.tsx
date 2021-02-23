/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal, { ModalProps } from '../useModal';
import Hike from '../state/Hike';

type Props = {
  leafletMap: L.Map,
  hike: Hike,
}

const GotoLocationDialog = ({
  show,
  onHide,
  leafletMap,
  hike,
}: Props & ModalProps): ReactElement => {
  type FormType = {
    lat: string;
    lng: string;
  }

  const handleGoClick = async (vals: FormType) => {
    if (hike.map === null) {
      throw new Error('map is null');
    }

    const latLng = {
      lat: parseFloat(vals.lat),
      lng: parseFloat(vals.lng),
    };

    leafletMap.panTo(latLng);
    hike.map.showLocationPopup(latLng);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} role="dialog">
      <Formik<FormType>
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

// GotoLocationDialog.propTypes = {
//   show: PropTypes.bool.isRequired,
//   onHide: PropTypes.func.isRequired,
//   leafletMap: PropTypes.shape().isRequired,
//   hike: PropTypes.shape().isRequired,
// };

// const useGotoLocationDialog = () => (
//   useModal(GotoLocationDialog)
// );
export const useGotoLocationDialog = (): [
  (props: Props) => (ReactElement | null),
  () => void,
] => useModal<Props>(GotoLocationDialog);

export default GotoLocationDialog;
