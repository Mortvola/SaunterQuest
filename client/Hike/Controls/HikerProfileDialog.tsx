/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { Field, FormikErrors } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { FormField, FormModal } from '@mortvola/forms';
import {
  metersToMiles, milesToMeters, toTimeFloat, toTimeString,
} from '../../utilities';
import { HikeLegInterface, HikerProfileInterface } from '../../state/Types';
import styles from './HikerProfileDialog.module.css';

type PropsType = {
  hikeLeg: HikeLegInterface,
  profile?: HikerProfileInterface | null,
}

const HikerProfileDialog: React.FC<PropsType & ModalProps> = ({
  hikeLeg,
  profile = null,
  setShow,
}) => {
  type FormValues = {
    breakDuration: string,
    pace: string,
    startTime: string,
    endTime: string,
    startDay: string,
    endDay: string,
    endDayExtension: string,
  }

  const maxMetersPerHour = 5036.74271751148;

  const incrementValue = (value: null | number) => {
    if (value !== null) {
      return (value + 1).toString();
    }

    return '';
  };

  const decrementValue = (value: string) => {
    if (value !== '') {
      return parseInt(value, 10) - 1;
    }

    return null;
  };

  const handleSubmit = async (vals: FormValues) => {
    if (profile) {
      profile.update({
        id: profile.id,
        breakDuration: parseInt(vals.breakDuration, 10),
        metersPerHour: milesToMeters(parseFloat(vals.pace)),
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
        startDay: decrementValue(vals.startDay),
        endDay: decrementValue(vals.endDay),
        endDayExtension: parseInt(vals.endDayExtension, 10),
      });
    }
    else {
      hikeLeg.addHikerProfile({
        id: 0,
        breakDuration: parseInt(vals.breakDuration, 10),
        metersPerHour: milesToMeters(parseFloat(vals.pace)),
        startTime: toTimeFloat(vals.startTime),
        endTime: toTimeFloat(vals.endTime),
        startDay: decrementValue(vals.startDay),
        endDay: decrementValue(vals.endDay),
        endDayExtension: parseInt(vals.endDayExtension, 10),
      });
    }

    setShow(false);
  };

  const handleValidate = (v: FormValues): FormikErrors<FormValues> => {
    const errors: FormikErrors<FormValues> = {};

    return errors;
  };

  return (
    <FormModal<FormValues>
      initialValues={{
        startTime: profile ? (toTimeString(profile.startTime) ?? '') : '',
        endTime: profile ? (toTimeString(profile.endTime) ?? '') : '',
        startDay: profile ? (incrementValue(profile.startDay) ?? '') : '',
        endDay: profile ? (incrementValue(profile.endDay) ?? '') : '',
        pace: profile ? metersToMiles(profile.metersPerHour ?? maxMetersPerHour).toFixed(2) : '',
        breakDuration: profile ? (profile.breakDuration?.toString() ?? '') : '',
        endDayExtension: profile ? (profile.endDayExtension?.toString() ?? '') : '',
      }}
      onSubmit={handleSubmit}
      title="Profile"
      validate={handleValidate}
      setShow={setShow}
    >
      <div className={styles.twoColumn}>
        <FormField type="number" name="startDay" label="Effective Day:" />
        <div />

        <FormField type="text" name="pace" label="Average Flat Ground Speed (mph):" />
        <div />

        <FormField type="time" name="startTime" label="Daily Start Time" />
        <FormField type="time" name="endTime" label="Daily End Time" />

        <FormField type="number" name="breakDuration" label="Daily Break Duration (minutes):" />
        <div />

        <FormField type="number" name="endDayExtension" label="End of Day Extension (minutes):" />
        <div />

      </div>
    </FormModal>
  );
};

export const useHikerProfileDialog = makeUseModal<PropsType>(HikerProfileDialog);

export default HikerProfileDialog;
