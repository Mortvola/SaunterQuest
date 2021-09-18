/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Formik, Form, Field } from 'formik';
import { Modal } from 'react-bootstrap';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { toTimeFloat, toTimeString } from './utilities';

type PropsType = {
  values?: {
    paceFactor: number,
    startTime: number,
    endTime: number,
    breakDuration: number,
    endDayExtension: number,
    endHikeDayExtension: number,
  },
};

const ProfileDialog = ({
  values = {
    paceFactor: 100,
    startTime: 7.0,
    endTime: 18.0,
    breakDuration: 60,
    endDayExtension: 60,
    endHikeDayExtension: 60,
  },
  show = false,
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = {
    startTime: string,
    endTime: string,
  }

  const handleSubmit = async (vals: ValuesType) => {
    const headers = new Headers();

    const crsfElement = document.querySelector('meta[name="csrf-token"]');
    if (crsfElement) {
      const token = crsfElement.getAttribute('content');
      if (token) {
        headers.append('X-CSRF-TOKEN', token);
      }
    }

    headers.append('Content-Type', 'application/json');

    fetch('/user/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...vals,
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
      }),
    })
      .then((response) => {
        if (response.ok) {
          if (onHide) {
            onHide();
          }
        }
      });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Formik<ValuesType>
        initialValues={{
          ...values,
          startTime: toTimeString(values.startTime) ?? '',
          endTime: toTimeString(values.endTime) ?? '',
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

const useProfileDialog = (): UseModalType<PropsType> => (
  useModal<PropsType>(ProfileDialog)
);

export default ProfileDialog;
export { useProfileDialog };
