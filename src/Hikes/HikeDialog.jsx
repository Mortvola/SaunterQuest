import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

const HikeDialog = ({
    show,
    onHide,
}) => {
    const formRef = useRef(null);

    const insertHike = () => {
        const formData = new FormData(formRef.current);

        fetch('hike', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                Accept: 'application/json',
            },
            body: formData,
        })
            .then(async (response) => {
                if (response.ok) {
                    const json = await response.json();
                    document.location.href = `/hike/${json.id}`;
                }
            });
    };

    return (
        <Modal show={show} onHide={onHide} role="dialog">
            <Modal.Header closeButton>
                Name Your Hike
            </Modal.Header>
            <Modal.Body>
                <form ref={formRef}>
                    <label>Name:</label>
                    <input type="text" className="form-control" name="name" />
                    <br />
                </form>
            </Modal.Body>
            <Modal.Footer>
                <button type="button" className="btn" onClick={onHide}>Cancel</button>
                <button
                    type="button"
                    className="btn btn-default"
                    onClick={insertHike}
                >
                    Save
                </button>
            </Modal.Footer>
        </Modal>
    );
};

HikeDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
};

export default HikeDialog;
