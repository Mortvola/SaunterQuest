import React from 'react';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { FormField, FormModal } from '@mortvola/forms';
import { FormikContextType, FormikErrors } from 'formik';
import { DateTime } from 'luxon';
import { BlackoutDatesInterface, BlackoutDatesManagerInterface } from './state/Types';
import styles from './BlackoutDialog.module.css';

type PropsType = {
  blackoutDatesManager: BlackoutDatesManagerInterface,
  blackoutDates?: BlackoutDatesInterface,
  start?: DateTime,
  end?: DateTime,
}

const BlackoutDialog: React.FC<PropsType & ModalProps> = ({
  blackoutDatesManager,
  blackoutDates,
  start,
  end,
  setShow,
}) => {
  type FormValues = {
    name: string,
    start: string,
    end: string,
  };

  const handleSubmit = (values: FormValues) => {
    if (blackoutDates) {
      blackoutDates.update(
        values.name,
        DateTime.fromISO(values.start),
        DateTime.fromISO(values.end),
      );
    }
    else {
      blackoutDatesManager.addBlackoutDates(
        values.name,
        DateTime.fromISO(values.start),
        DateTime.fromISO(values.end),
      );
    }

    setShow(false);
  };

  const handleValidate = (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};

    if (values.name === '') {
      errors.name = 'A name for the blackout dates must be provided';
    }

    if (values.start === '') {
      errors.start = 'A valid start date must be provided';
    }

    if (values.end === '') {
      errors.end = 'A valid end date must be provided';
    }

    return errors;
  };

  const handleDelete = (bag: FormikContextType<FormValues>) => {
    if (blackoutDates) {
      blackoutDatesManager.deleteBlackoutDates(blackoutDates);
    }

    setShow(false);
  };

  return (
    <FormModal<FormValues>
      initialValues={{
        name: blackoutDates?.name ?? '',
        start: blackoutDates?.start.toISODate() ?? (start?.toISODate() ?? ''),
        end: blackoutDates?.end.toISODate() ?? (end?.toISODate() ?? ''),
      }}
      title="Blackout Dates Settings"
      setShow={setShow}
      onSubmit={handleSubmit}
      validate={handleValidate}
      onDelete={blackoutDates ? handleDelete : null}
    >
      <div className={styles.form}>
        <FormField type="text" name="name" label="Name:" />
        <FormField type="date" name="start" label="Start Date:" />
        <FormField type="date" name="end" label="End Date:" />
      </div>
    </FormModal>
  );
};

export const useBlackoutDialog = makeUseModal<PropsType>(BlackoutDialog);

export default BlackoutDialog;
