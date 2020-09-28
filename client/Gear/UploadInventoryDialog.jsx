import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import useModal from '../Modal';

const FileUpload = ({
    field,
    form,
}) => {
    const handleChange = (event) => {
        const file = event.currentTarget.files[0];
        form.setFieldValue(field.name, file);
    };

    return (
        <input type="file" accept=".csv" onChange={handleChange} className="form-control" />
    );
};

FileUpload.propTypes = {
    field: PropTypes.shape().isRequired,
    form: PropTypes.shape().isRequired,
};

const UploadInventoryDialog = ({
    show,
    onHide,
}) => {
    const handleSubmit = (values) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const lines = e.target.result.split('\n');

            const topRow = lines.splice(0, 1)[0].split(',');

            const colMap = {};
            colMap.name = topRow.findIndex((l) => l === 'Name');
            colMap.description = topRow.findIndex((l) => l === 'Description');
            colMap.system = topRow.findIndex((l) => l === 'System');
            colMap.weight = topRow.findIndex((l) => l === 'Weight');
            colMap.unitOfMeasure = topRow.findIndex((l) => l === 'Unit of Measure');

            const result = lines
                .map((l) => (
                    l.split(',')
                ))
                .filter((row) => (
                    row[colMap.name]
                        && (row[colMap.description]
                        || row[colMap.system]
                        || row[colMap.weight]
                        || row[colMap.unitOfMeasure])
                ))
                .map((row) => ({
                    name: row[colMap.name],
                    description: row[colMap.description],
                    system: row[colMap.system],
                    weight: parseFloat(row[colMap.weight]),
                    unitOfMeasure: row[colMap.unitOfMeasure],
                    consumable: false,
                }));

            fetch('/gear/item', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Context-Type': 'application/json',
                },
                body: JSON.stringify(result),
            })
                .then((response) => {
                    if (response.ok) {
                        onHide();
                    }
                });
        };

        reader.readAsText(values.file);
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Formik
                initialValues={{
                    file: '',
                }}
                onSubmit={handleSubmit}
            >
                <Form>
                    <Modal.Header closeButton>
                        <h4 id="modalTitle" className="modal-title">Upload Inventory File</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <Field
                            name="file"
                            component={FileUpload}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onHide}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Formik>
        </Modal>
    );
};

UploadInventoryDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
};

const useUploadInventoryDialog = () => {
    const [DialogModal, showDialogModal] = useModal(UploadInventoryDialog);

    const createProfileDialog = () => (
        <DialogModal />
    );

    return [
        createProfileDialog,
        showDialogModal,
    ];
};

export default UploadInventoryDialog;
export { useUploadInventoryDialog };
