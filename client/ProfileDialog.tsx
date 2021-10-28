/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Formik, Form, Field } from 'formik';
import { Modal } from 'react-bootstrap';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';
import { toTimeFloat, toTimeString } from './utilities';

export type PropsType = {
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
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = {
    startTime: string,
    endTime: string,
  }

  const handleSubmit = async (vals: ValuesType) => {
    const response = await Http.put('/user/profile', {
      ...vals,
      startTime: toTimeFloat(vals.startTime),
      endTime: toTimeFloat(vals.endTime),
    });

    if (response.ok) {
      if (onHide) {
        onHide();
      }
    }
  };

  return (
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
  );
};

export const useProfileDialog = makeUseModal<PropsType>(ProfileDialog);

export default ProfileDialog;
