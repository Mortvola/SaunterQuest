/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  ReactElement, useEffect, useState,
} from 'react';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import Http from '@mortvola/http';
import { FormModal, FormField } from '@mortvola/forms';
import { FormikErrors } from 'formik';
import { HikeInterface } from '../state/Types';

type PropsType = {
  hike: HikeInterface,
}

const HikeSettingsDialog: React.FC<PropsType & ModalProps> = ({
  hike,
  setShow,
}): ReactElement => {
  type Group = {
    id: number,
    name: string,
  };

  type FormValues = {
    name: string,
    routeGroupId: string,
  }

  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    (async () => {
      const response = await Http.get<Group[]>('/api/route-groups');

      if (response.ok) {
        const body = await response.body();

        setGroups(body);
      }
    })();
  }, []);

  const handleSubmit = (values: FormValues) => {
    let routeGroupId: number | null = parseInt(values.routeGroupId, 10);

    if (routeGroupId === -1) {
      routeGroupId = null;
    }

    hike.updateSettings(values.name, routeGroupId);
    setShow(false);
  };

  const handleValidate = (values: FormValues) => {
    const errors: FormikErrors<FormValues> = {};

    if (values.name === '') {
      errors.name = 'A name for the hike must be provided';
    }

    return errors;
  };

  return (
    <>
      <FormModal<FormValues>
        initialValues={{
          name: hike.name,
          routeGroupId: (hike.routeGroupId ?? -1).toString(),
        }}
        title="Hike Settings"
        setShow={setShow}
        onSubmit={handleSubmit}
        validate={handleValidate}
      >
        <label>Name:</label>
        <FormField type="text" name="name" />
        <br />
        <FormField as="select" name="routeGroupId" label="Preferred Trail">
          <option value={-1}>None</option>
          {
            groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))
          }
        </FormField>
      </FormModal>
    </>
  );
};

export const useHikeDialog = makeUseModal<PropsType>(HikeSettingsDialog);

export default HikeSettingsDialog;
