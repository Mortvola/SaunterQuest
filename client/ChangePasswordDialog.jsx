import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import {
  Formik, Form, Field, ErrorMessage,
} from 'formik';
import useModal from './Modal';

const Error = ({
  name,
}) => (
  <ErrorMessage name={name}>{(msg) => <div className="text-danger">{msg}</div>}</ErrorMessage>
);

Error.propTypes = {
  name: PropTypes.string.isRequired,
};

const ChangePasswordDialog = ({
  show,
  onHide,
}) => {
  const handleSubmit = async (vals, { setErrors }) => {
    const formData = new FormData();
    Object.keys(vals).forEach((key) => {
      formData.set(key, vals[key]);
    });

    fetch('/password/change', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        Accept: 'application/json',
      },
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          onHide();
          return null;
        }

        return response.json();
      })
      .then((response) => {
        if (response.errors) {
          setErrors(response.errors);
        }
      });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Formik
        initialValues={{}}
        onSubmit={handleSubmit}
      >
        <Form>
          <Modal.Header closeButton>
            <h4 id="modalTitle" className="modal-title">Change Password</h4>
          </Modal.Header>
          <Modal.Body>
            <label>Current Password</label>
            <Field type="password" className="form-control" name="currentPassword" defaultValue="" />
            <Error name="currentPassword" />
            <br />
            <label>Password</label>
            <Field type="password" className="form-control" name="password" defaultValue="" />
            <Error name="password" />
            <br />
            <label>Confirm Password</label>
            <Field type="password" className="form-control" name="passwordConfirmation" defaultValue="" />
            <Error name="passwordConfirmation" />
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

ChangePasswordDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

const useChangePasswordDialog = () => (
  useModal(ChangePasswordDialog)
);

export default ChangePasswordDialog;
export { useChangePasswordDialog };
