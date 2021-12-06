/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import L from 'leaflet';
import Hike from '../state/Hike';

type PropsType = {
  leafletMap: L.Map,
  hike: Hike,
}

const GotoLocationDialog = ({
  setShow,
  leafletMap,
  hike,
}: PropsType & ModalProps): ReactElement => {
  type FormType = {
    lat: string;
    lng: string;
  }

  const handleGoClick = async (vals: FormType) => {
    if (hike.map === null) {
      throw new Error('map is null');
    }

    const latLng = new L.LatLng(
      parseFloat(vals.lat),
      parseFloat(vals.lng),
    );

    leafletMap.panTo(latLng);
    hike.map.showLocationPopup(latLng);
    setShow(false);
  };

  return (
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
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" type="submit">Go</Button>
        </Modal.Footer>
      </Form>
    </Formik>
  );
};

export const useGotoLocationDialog = makeUseModal<PropsType>(GotoLocationDialog);

export default GotoLocationDialog;
