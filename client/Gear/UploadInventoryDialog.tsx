import React, { ReactElement } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';

type FileUploadPropsType = {
  field: { name: string },
  form: { setFieldValue: (name: string, file: File) => void },
};

const FileUpload = ({
  field,
  form,
}: FileUploadPropsType): ReactElement => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    if (target) {
      const { files } = target;

      if (files) {
        const file = files[0];
        form.setFieldValue(field.name, file);
      }
    }
  };

  return (
    <input type="file" accept=".csv" onChange={handleChange} className="form-control" />
  );
};

type PropsType = {
}

const UploadInventoryDialog = ({
  setShow,
}: PropsType & ModalProps): ReactElement => {
  type ValuesType = {
    file: Blob | string,
  }

  const handleSubmit = (values: ValuesType) => {
    const colMap = {
      name: -1,
      description: -1,
      system: -1,
      weight: -1,
      unitOfMeasure: -1,
    };

    let topRow: string[];
    let lines: string[];

    const reader = new FileReader();
    reader.onload = async (e) => {
      const { target } = e;
      if (target) {
        const { result } = target;
        if (result) {
          if (typeof result !== 'string') {
            throw new Error('result is not a string');
          }

          lines = result.split('\n');
        }
      }

      if (lines) {
        topRow = lines.splice(0, 1)[0].split(',');

        colMap.name = topRow.findIndex((l) => l === 'Name');
        colMap.description = topRow.findIndex((l) => l === 'Description');
        colMap.system = topRow.findIndex((l) => l === 'System');
        colMap.weight = topRow.findIndex((l) => l === 'Weight');
        colMap.unitOfMeasure = topRow.findIndex((l) => l === 'Unit of Measure');
      }

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

      const response = await Http.post('/gear/item', result);

      if (response.ok) {
        setShow(false);
      }
    };

    if (typeof values.file !== 'string') {
      reader.readAsText(values.file);
    }
  };

  return (
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
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </Modal.Footer>
      </Form>
    </Formik>
  );
};

const useUploadInventoryDialog = makeUseModal<PropsType>(UploadInventoryDialog);

export default UploadInventoryDialog;
export { useUploadInventoryDialog };
