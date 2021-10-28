/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';

type PropsType = {
}

const AccountDialog = ({
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = {
  };

  const handleSubmit = async (vals: ValuesType) => {
    const headers = new Headers();

    headers.append('Content-Type', 'application/json');

    const response = await Http.put('/user/account', { ...vals });

    if (response.ok) {
      if (onHide) {
        onHide();
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
          <h4 id="modalTitle" className="modal-title">Account</h4>
        </Modal.Header>
        <Modal.Body>
          <label>Name</label>
          <Field type="text" className="form-control" name="name" defaultValue="" />
          <br />
          <label>E-Mail Address</label>
          <Field type="text" className="form-control" name="emailAddress" defaultValue="" />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn" onClick={onHide}>Cancel</button>
          <button type="submit" className="btn btn-default">Save</button>
        </Modal.Footer>
      </Form>
    </Formik>
  );
};

const useAccountDialog = makeUseModal<PropsType>(AccountDialog);

export default AccountDialog;
export { useAccountDialog };
