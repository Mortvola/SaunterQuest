import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

const DeleteConfirmation = ({
    onConfirm,
    onHide,
    children,
    ...props
}) => (
    <Modal onHide={onHide} {...props}>
        <Modal.Header closeButton>
            <Modal.Title>
                Delete Confirmation
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>{children}</p>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </Modal.Footer>
    </Modal>
);

DeleteConfirmation.propTypes = {
    onHide: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    children: PropTypes.string,
};

DeleteConfirmation.defaultProps = {
    children: null,
};

export default DeleteConfirmation;
