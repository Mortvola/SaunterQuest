import React from 'react';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { HikeLegInterface } from '../state/Types';
import { FormField, FormModal } from '@mortvola/forms';
import { FormikErrors } from 'formik';
import styles from './HikeLegDialog.module.css';

type PropsType = {
  hikeLeg: HikeLegInterface,
}

const HikeLegDialog: React.FC<PropsType & ModalProps> = ({
  hikeLeg,
  setShow,
}) => {
  type FormValues = {
    name: string,
    startDate: string,
    color: string,
  };

  const handleSubmit = (values: FormValues) => {
    hikeLeg.update(
      values.name,
      values.startDate === '' ? null : values.startDate,
      values.color,
    );

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
        startDate: hikeLeg.startDate?.toISODate() ?? '',
        color: hikeLeg.color,
      }}
      title="Hike Leg Settings"
      setShow={setShow}
      onSubmit={handleSubmit}
      validate={handleValidate}
    >
      <div className={styles.form}>
        <FormField type="text" name="name" label="Name:" />
        <FormField type="date" name="startDate" label="Start Date:" />
        <FormField type="color" name="color" label="Color:" />
      </div>
    </FormModal>
  );
};

export const useHikeLegDialog = makeUseModal<PropsType>(HikeLegDialog);

export default HikeLegDialog;
