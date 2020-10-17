import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal from '../Modal';
import { toTimeFloat, toTimeString } from '../utilities';
import { addHikerProfile, updateHikerProfile } from '../redux/actions';

const HikerProfileDialog = ({
  hikeId,
  profile,
  show,
  onHide,
  dispatch,
}) => {
  const incrementValue = (value) => {
    if (value !== '' && value !== undefined && value !== null) {
      return value + 1;
    }

    return '';
  };

  const decrementValue = (value) => {
    if (value !== '' && value !== undefined && value !== null) {
      return value - 1;
    }

    return null;
  };

  const handleSubmit = async (vals) => {
    let url = `/hike/${hikeId}/hiker-profile`;
    let method = 'POST';
    const { id, ...v2 } = vals;
    if (id !== undefined && id !== null) {
      url = `${url}/${id}`;
      method = 'PUT';
    }

    fetch(url, {
      method,
      headers:
            {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
              'Content-Type': 'application/json',
            },
      body: JSON.stringify({
        ...v2,
        startTime: toTimeFloat(v2.startTime),
        endTime: toTimeFloat(v2.endTime),
        startDay: decrementValue(v2.startDay),
        endDay: decrementValue(v2.endDay),
      }),
    })
      .then(async (response) => {
        if (response.ok) {
          if (method === 'POST') {
            dispatch(addHikerProfile(await response.json()));
          }
          else {
            dispatch(updateHikerProfile(await response.json()));
          }
          onHide();
        }
      });
  };

  const nullsToEmptyStrings = (v) => {
    const v2 = v;

    Object.keys(v2).forEach((k) => {
      if (v2[k] === null) {
        v2[k] = '';
      }
    });

    return v2;
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Formik
        initialValues={{
          ...nullsToEmptyStrings(profile),
          startTime: toTimeString(profile.startTime),
          endTime: toTimeString(profile.endTime),
          startDay: incrementValue(profile.startDay),
          endDay: incrementValue(profile.endDay),
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

HikerProfileDialog.propTypes = {
  hikeId: PropTypes.number.isRequired,
  profile: PropTypes.shape(),
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
};

HikerProfileDialog.defaultProps = {
  profile: {
    startDay: '',
    endDay: '',
    speedFactor: 100,
    startTime: 7.0,
    endTime: 18.00,
    breakDuration: 60,
    endDayExtension: 60,
    endHikeDayExtension: 60,
  },
};

const useHikerProfileDialog = () => {
  const [DialogModal, showDialogModal] = useModal(connect()(HikerProfileDialog));

  return [
    DialogModal,
    showDialogModal,
  ];
};

export default HikerProfileDialog;
export { useHikerProfileDialog };
