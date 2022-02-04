/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';
import { FormikErrors } from 'formik';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';
import { FormModal, FormField } from '@mortvola/forms';
import {
  metersToMiles, milesToMeters, toTimeFloat, toTimeString,
} from './utilities';
import styles from './ProfileDialog.module.css';

type Profile = {
  metersPerHour: number | null,
  startTime: number | null,
  endTime: number | null,
  breakDuration: number | null,
  endDayExtension: number | null,
  endHikeDayExtension: number | null,
};

const ProfileDialog: React.FC<ModalProps> = ({
  setShow,
}) => {
  type FormValues = {
    milesPerHour: string,
    startTime: string,
    endTime: string,
    breakDuration: number,
    endDayExtension: number,
    endHikeDayExtension: number,
  }

  const flatGroundSpeed = 3.12968585912282;
  const maxMetersPerHour = 5036.74271751148;

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const response = await Http.get<Profile>('/user/profile');

      if (response.ok) {
        setProfile(await response.body());
      }
    })();
  }, []);

  const handleSubmit = async (vals: FormValues) => {
    const response = await Http.put('/user/profile', {
      metersPerHour: milesToMeters(vals.milesPerHour),
      startTime: toTimeFloat(vals.startTime),
      endTime: toTimeFloat(vals.endTime),
      breakDuration: vals.breakDuration,
      endDayExtension: vals.endDayExtension,
      endHikeDayExtension: vals.endHikeDayExtension,
    });

    if (response.ok) {
      setShow(false);
    }
  };

  const handleValidate = (v: FormValues): FormikErrors<FormValues> => {
    const errors: FormikErrors<FormValues> = {};

    return errors;
  };

  if (profile !== null) {
    return (
      <FormModal<FormValues>
        initialValues={{
          milesPerHour: metersToMiles(profile.metersPerHour ?? maxMetersPerHour).toFixed(2),
          startTime: toTimeString(profile.startTime ?? 8) ?? '',
          endTime: toTimeString(profile.endTime ?? 18) ?? '',
          breakDuration: profile.breakDuration ?? 60,
          endDayExtension: profile.endDayExtension ?? 60,
          endHikeDayExtension: profile.endHikeDayExtension ?? 60,
        }}
        title="Profile"
        onSubmit={handleSubmit}
        validate={handleValidate}
        setShow={setShow}
      >
        <div className={styles.twoColumn}>
          <FormField type="text" name="milesPerHour" label="Average Flat Ground Speed (mph):" />
          <div />
          <FormField type="time" name="startTime" label="Daily Start Time:" />
          <FormField type="time" name="endTime" label="Daily End Time:" />
          <FormField type="number" name="breakDuration" label="Daily Break Duration (minutes):" />
          <div />
          <FormField type="number" name="endDayExtension" label="End of Day Extension (minutes):" />
          <FormField type="number" name="endHikeDayExtension" label="End of Hike Extension:" />
        </div>
      </FormModal>
    );
  }

  return null;
};

export const useProfileDialog = makeUseModal(ProfileDialog);

export default ProfileDialog;
