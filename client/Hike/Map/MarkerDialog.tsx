import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { FormikContextType, FormikErrors } from 'formik';
import React from 'react';
import { setFormErrors } from '../../Modal/Errors';
import FormModal from '../../Modal/FormModal';
import { MapMarkerInterface } from '../../state/Types';

type PropsType = {
  marker: MapMarkerInterface,
}

const MarkerDialog: React.FC<ModalProps & PropsType> = ({
  marker,
  setShow,
}) => {
  type FormValues = {};

  const handleSubmit = () => {
    // no code
  };

  const handleValidate = (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};

    return errors;
  };

  const handleDelete = async (bag: FormikContextType<FormValues>) => {
    const { setErrors } = bag;
    const errors = null;

    marker.delete();

    if (errors) {
      setFormErrors(setErrors, errors);
    }
    else {
      setShow(false);
    }
  };

  return (
    <FormModal<FormValues>
      initialValues={{}}
      title="Edit Marker"
      setShow={setShow}
      onSubmit={handleSubmit}
      validate={handleValidate}
      onDelete={handleDelete}
    >
      <div />
    </FormModal>
  );
};

export const useMarkerDialog = makeUseModal<PropsType>(MarkerDialog);

export default MarkerDialog;
