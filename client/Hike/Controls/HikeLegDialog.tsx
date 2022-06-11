import React from 'react';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { FormField, FormModal, FormRadio } from '@mortvola/forms';
import { FieldHookConfig, FormikErrors, useField } from 'formik';
import { HikeInterface, HikeLegInterface } from '../state/Types';
import styles from './HikeLegDialog.module.css';
import HikeLegSelect from './HikeLegSelect';
import { StartType } from '../../../common/ResponseTypes';

type SelectPropsType = {
  hike: HikeInterface,
}

const FormHikeLegSelect: React.FC<SelectPropsType & FieldHookConfig<number | null>> = ({
  hike,
  ...props
}) => {
  const [field, meta, helpers] = useField(props);

  const handleLegChange = (id: number | null) => {
    helpers.setValue(id);
  };

  return (
    <HikeLegSelect
      {...field}
      {...props}
      hike={hike}
      onChange={handleLegChange}
    />
  );
};

type PropsType = {
  hike: HikeInterface,
  hikeLeg: HikeLegInterface,
}

const HikeLegDialog: React.FC<PropsType & ModalProps> = ({
  hike,
  hikeLeg,
  setShow,
}) => {
  type FormValues = {
    name: string,
    color: string,
    startType: StartType,
    startDate: string,
    afterHikeLegId: number | null,
    numberOfZeros: number | null,
  };

  const handleSubmit = (values: FormValues) => {
    hikeLeg.update(
      values.name,
      values.color,
      values.startType,
      values.startDate === '' ? null : values.startDate,
      values.afterHikeLegId,
      values.numberOfZeros ?? 0,
    );

    setShow(false);
  };

  const handleValidate = (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};

    if (values.name === '') {
      errors.name = 'A name for the hike leg must be provided';
    }

    switch (values.startType) {
      case 'none':
        break;

      case 'date':
        if (values.startDate === '') {
          errors.startType = 'Date must be provided';
        }
        break;

      case 'afterLeg':
        if (values.afterHikeLegId === null) {
          errors.startType = 'Hike Leg must be selected';
        }
        break;

      default:
        errors.startType = 'Invalid start type';
    }

    return errors;
  };

  return (
    <FormModal<FormValues>
      initialValues={{
        name: hikeLeg.name ?? hikeLeg.id.toString(),
        color: hikeLeg.color,
        startType: hikeLeg.startType,
        startDate: hikeLeg.startDate?.toISODate() ?? '',
        afterHikeLegId: hikeLeg.afterHikeLegId,
        numberOfZeros: hikeLeg.numberOfZeros,
      }}
      title="Hike Leg Settings"
      setShow={setShow}
      onSubmit={handleSubmit}
      validate={handleValidate}
    >
      <div className={styles.form}>
        <FormField type="text" name="name" label="Name:" />
        <FormRadio name="startType" value="none" label="No Start Date" />
        <FormRadio name="startType" value="date" label="Start Date" />
        <FormField type="date" name="startDate" />
        <FormRadio name="startType" value="afterLeg" label="Previous Leg" />
        <FormHikeLegSelect name="afterHikeLegId" hike={hike} />
        <FormField type="color" name="color" label="Color:" />
        <FormField type="text" name="numberOfZeros" label="Number of Zeros:" />
      </div>
    </FormModal>
  );
};

export const useHikeLegDialog = makeUseModal<PropsType>(HikeLegDialog);

export default HikeLegDialog;
