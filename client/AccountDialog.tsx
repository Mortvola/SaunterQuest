/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/require-default-props */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal, { UseModalType, ModalProps } from '@mortvola/usemodal';

type PropsType = {
}

const AccountDialog = ({
  show = false,
  onHide,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = {
  };

  const handleSubmit = async (vals: ValuesType) => {
    const headers = new Headers();

    headers.append('Content-Type', 'application/json');

    fetch('/user/account', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...vals }),
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
    </Modal>
  );
};

const useAccountDialog = (): UseModalType<PropsType> => useModal<PropsType>(AccountDialog);

export default AccountDialog;
export { useAccountDialog };
