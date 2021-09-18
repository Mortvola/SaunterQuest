/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { toTimeFloat, toTimeString } from '../utilities';
import HikerProfile from '../state/HikerProfile';
import Hike from '../state/Hike';

type PropsType = {
  hike: Hike,
  profile?: HikerProfile | null,
}

const HikerProfileDialog = ({
  hike,
  profile,
  show,
  onHide,
}: PropsType & ModalProps): ReactElement | null => {
  type ValuesType = {
    breakDuration: string,
    speedFactor: string,
    startTime: string,
    endTime: string,
    startDay: string,
    endDay: string,
    endDayExtension: string,
  }

  const incrementValue = (value: null | number) => {
    if (value !== null) {
      return (value + 1).toString();
    }

    return '';
  };

  const decrementValue = (value: string) => {
    if (value !== '') {
      return parseInt(value, 10) - 1;
    }

    return null;
  };

  const handleSubmit = async (vals: ValuesType) => {
    if (profile) {
      profile.update({
        id: profile.id,
        breakDuration: parseInt(vals.breakDuration, 10),
        speedFactor: parseInt(vals.speedFactor, 10),
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
        startDay: decrementValue(vals.startDay),
        endDay: decrementValue(vals.endDay),
        endDayExtension: parseInt(vals.endDayExtension, 10),
      });
    }
    else {
      hike.addHikerProfile({
        id: 0,
        breakDuration: parseInt(vals.breakDuration, 10),
        speedFactor: parseInt(vals.speedFactor, 10),
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
        startDay: decrementValue(vals.startDay),
        endDay: decrementValue(vals.endDay),
        endDayExtension: parseInt(vals.endDayExtension, 10),
      });
    }

    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Formik<ValuesType>
        initialValues={{
          startTime: profile ? (toTimeString(profile.startTime) ?? '') : '',
          endTime: profile ? (toTimeString(profile.endTime) ?? '') : '',
          startDay: profile ? (incrementValue(profile.startDay) ?? '') : '',
          endDay: profile ? (incrementValue(profile.endDay) ?? '') : '',
          speedFactor: profile && (profile.speedFactor !== null) ? (profile.speedFactor.toString() ?? '') : '',
          breakDuration: profile && (profile.breakDuration !== null) ? (profile.breakDuration.toString() ?? '') : '',
          endDayExtension: profile && (profile.endDayExtension !== null) ? (profile.endDayExtension.toString() ?? '') : '',
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
                Start Day:
                <Field type="number" className="form-control" name="startDay" />
              </label>

              <label>
                End Day:
                <Field type="number" className="form-control" name="endDay" />
              </label>

              <label>
                Pace Factor (%):
                <Field type="number" className="form-control" name="speedFactor" />
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

HikerProfileDialog.defaultProps = {
  profile: null,
};

const useHikerProfileDialog = (): UseModalType<PropsType> => (
  useModal<PropsType>(HikerProfileDialog)
);

export default HikerProfileDialog;
export { useHikerProfileDialog };
