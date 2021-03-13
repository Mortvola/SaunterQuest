/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal, { ModalProps } from '../useModal';
import Anchor from '../state/Anchor';

type Props = {
  waypoint: Anchor,
}

const WaypointDialog = ({
  show,
  onHide,
  waypoint,
}: Props & ModalProps): ReactElement => {
  type FormType = {
    campsite: boolean;
  }

  const handleSubmit = async (vals: FormType) => {
    waypoint.campsite = vals.campsite;
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} role="dialog">
      <Formik<FormType>
        initialValues={{
          campsite: waypoint.campsite,
        }}
        onSubmit={handleSubmit}
      >
        <Form>
          <Modal.Header closeButton>
            Goto Location
          </Modal.Header>
          <Modal.Body>
            <label>
              <Field type="checkbox" name="campsite" />
              Campsite
            </label>
            <br />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit">Save</Button>
          </Modal.Footer>
        </Form>
      </Formik>
    </Modal>
  );
};

// WaypointDialog.propTypes = {
//   show: PropTypes.bool.isRequired,
//   onHide: PropTypes.func.isRequired,
//   leafletMap: PropTypes.shape().isRequired,
//   hike: PropTypes.shape().isRequired,
// };

// const useGotoLocationDialog = () => (
//   useModal(WaypointDialog)
// );
export const useWaypointDialog = (): [
  (props: Props) => (ReactElement | null),
  () => void,
] => useModal<Props>(WaypointDialog);

export default WaypointDialog;
