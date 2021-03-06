import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import { Modal } from 'react-bootstrap';
import useModal from './useModal';
import { toTimeFloat, toTimeString } from './utilities';

const ProfileDialog = ({
  values,
  show,
  onHide,
}) => {
  const handleSubmit = async (vals) => {
    fetch('/user/profile', {
      method: 'PUT',
      headers:
            {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
              'Content-Type': 'application/json',
            },
      body: JSON.stringify({
        ...vals,
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
      }),
    })
      .then((response) => {
        if (response.ok) {
          onHide();
        }
      });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Formik
        initialValues={{
          ...values,
          startTime: toTimeString(values.startTime),
          endTime: toTimeString(values.endTime),
        }}
        onSubmit={handleSubmit}
      >
        <Form>
          <Modal.Header closeButton>
            <h4 id="modalTitle" className="modal-title">Profile</h4>
          </Modal.Header>
          <Modal.Body>
            <div className="two-column">
              <label>
                Pace Factor (%):
                <Field type="number" className="form-control" name="paceFactor" />
              </label>
              <br />

              <label>
                Daily Start Time:
                <Field type="time" className="form-control" name="startTime" />
              </label>

              <label>
                Daily End Time:
                <Field type="time" className="form-control" name="endTime" />
              </label>

              <label>
                Daily Break Duration (minutes):
                <Field type="number" className="form-control" name="breakDuration" />
              </label>
              <br />

              <label>
                End of Day Extension (minutes)
                <Field type="number" className="form-control" name="endDayExtension" />
              </label>

              <label>
                End of Hike Extension (minutes)
                <Field type="number" className="form-control" name="endHikeDayExtension" />
              </label>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn" onClick={onHide}>Cancel</button>
            <button type="submit" className="btn btn-default">Save</button>
          </Modal.Footer>
        </Form>
      </Formik>
    </Modal>
  );
};

ProfileDialog.propTypes = {
  values: PropTypes.shape().isRequired,
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

const useProfileDialog = () => {
  const [DialogModal, showDialogModal] = useModal(ProfileDialog);
  const [values, setValues] = useState({
    paceFactor: 100,
    startTime: 7.0,
    endTime: 18.0,
    breakDuration: 60,
    endDayExtension: 60,
    endHikeDayExtension: 60,
  });

  const handleShowClick = () => {
    fetch('/user/profile')
      .then(async (response) => {
        if (response.ok) {
          setValues(await response.json());
          showDialogModal();
        }
      });
  };

  const createProfileDialog = () => (
    <DialogModal values={values} />
  );

  return [
    createProfileDialog,
    handleShowClick,
  ];
};

export default ProfileDialog;
export { useProfileDialog };
