/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import {
  Formik, Form, Field, ErrorMessage, FormikHelpers,
} from 'formik';
import useModal, { UseModalType, ModalProps } from '@mortvola/usemodal';

type ErrorProps = {
  name: string,
}

const Error = ({
  name,
}: ErrorProps): ReactElement => (
  <ErrorMessage name={name}>{(msg) => <div className="text-danger">{msg}</div>}</ErrorMessage>
);

type PropsType = {
}

const ChangePasswordDialog = ({
  show = false,
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = Record<string, string>;

  const handleSubmit = async (vals: ValuesType, { setErrors }: FormikHelpers<ValuesType>) => {
    const formData = new FormData();
    Object.keys(vals).forEach((key) => {
      formData.set(key, vals[key]);
    });

    const headers = new Headers();

    headers.append('Accept', 'application/json');

    fetch('/password/change', {
      method: 'POST',
      headers,
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          if (onHide) {
            onHide();
          }

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
      <Formik<ValuesType>
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

const useChangePasswordDialog = (): UseModalType<PropsType> => (
  useModal<PropsType>(ChangePasswordDialog)
);

export default ChangePasswordDialog;
export { useChangePasswordDialog };
