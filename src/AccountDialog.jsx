import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';

const AccountDialog = ({
    show,
    onHide,
}) => {
    const handleSubmit = async (vals) => {
        fetch('/user/account', {
            method: 'PUT',
            headers:
            {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...vals }),
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

AccountDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
};

const useAccountDialog = (
    onSave,
) => {
    const [show, setShow] = useState(false);

    const handleShowClick = () => {
        setShow(true);
    };

    const handleHide = () => {
        setShow(false);
    };

    const handleSave = () => {
        if (onSave) {
            onSave();
        }

        handleHide();
    };

    const createDialog = () => (
        <AccountDialog
            show={show}
            onHide={handleHide}
            onConfirm={handleSave}
        />
    );

    return [
        createDialog,
        handleShowClick,
    ];
};

export default AccountDialog;
export { useAccountDialog };
