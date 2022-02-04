/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { Field, FormikErrors } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { FormField, FormModal } from '@mortvola/forms';
import {
  metersToMiles, milesToMeters, toTimeFloat, toTimeString,
} from '../utilities';
import { HikeInterface, HikerProfileInterface } from '../state/Types';

type PropsType = {
  hike: HikeInterface,
  profile?: HikerProfileInterface | null,
}

const HikerProfileDialog: React.FC<PropsType & ModalProps> = ({
  hike,
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
      hike.addHikerProfile({
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
      <div className="two-column">
        <FormField type="text" name="pace" label="Average Flat Ground Speed (mph):" />
        <br />

        <label>
          Start Day:
          <Field type="number" className="form-control" name="startDay" />
        </label>

        <label>
          End Day:
          <Field type="number" className="form-control" name="endDay" />
        </label>

        <label>
          Daily Start Time:
          <Field type="time" className="form-control" name="startTime" />
        </label>

        <label>
          Daily End Time:
          <Field type="time" className="form-control" name="endTime" />
        </label>

        <label>
          Daily Break Duration (minutes):
          <Field type="number" className="form-control" name="breakDuration" />
        </label>
        <br />

        <label>
          End of Day Extension (minutes)
          <Field type="number" className="form-control" name="endDayExtension" />
        </label>
      </div>
    </FormModal>
  );
};

export const useHikerProfileDialog = makeUseModal<PropsType>(HikerProfileDialog);

export default HikerProfileDialog;
