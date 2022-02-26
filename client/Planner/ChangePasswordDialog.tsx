/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import {
  Formik, Form, Field, ErrorMessage, FormikHelpers,
} from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';
import { isErrorResponse } from '../../common/ResponseTypes';

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
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = Record<string, string>;

  const handleSubmit = async (vals: ValuesType, { setErrors }: FormikHelpers<ValuesType>) => {
    const formData = new FormData();
    Object.keys(vals).forEach((key) => {
      formData.set(key, vals[key]);
    });

    const response = await Http.post('/password/change', formData);

    if (response.ok) {
      if (onHide) {
        onHide();
      }
    }
    else {
      const body = await response.body();
      if (isErrorResponse(body) && body.errors) {
        const errors: Record<string, string> = {};

        body.errors.forEach((error) => {
          errors[error.field] = error.message;
        });

        setErrors(errors);
      }
    }
  };

  return (
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
  );
};

const useChangePasswordDialog = makeUseModal<PropsType>(ChangePasswordDialog);

export default ChangePasswordDialog;
export { useChangePasswordDialog };
