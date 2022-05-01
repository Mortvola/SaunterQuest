import React from 'react';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { HikeLegInterface } from '../state/Types';
import { FormField, FormModal } from '@mortvola/forms';
import { FormikErrors } from 'formik';

type PropsType = {
  hikeLeg: HikeLegInterface,
}

const HikeLegDialog: React.FC<PropsType & ModalProps> = ({
  hikeLeg,
  setShow,
}) => {
  type FormValues = {
    name: string,
  };

  const handleSubmit = (values: FormValues) => {
    hikeLeg.setName(values.name);
    setShow(false);
  };

  const handleValidate = (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};

    if (values.name === '') {
      errors.name = 'A name for the hike leg must be provided';
    }

    return errors;
  };

  return (
    <FormModal<FormValues>
      initialValues={{
        name: hikeLeg.name ?? hikeLeg.id.toString(),
      }}
      title="Hike Leg Settings"
      setShow={setShow}
      onSubmit={handleSubmit}
      validate={handleValidate}
    >
      <label>Name:</label>
      <FormField type="text" name="name" />
    </FormModal>
  );
};

export const useHikeLegDialog = makeUseModal<PropsType>(HikeLegDialog);

export default HikeLegDialog;
