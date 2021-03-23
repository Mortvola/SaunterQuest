import React from 'react';
import { useFormikContext } from 'formik';

function shallowEqual(object1: Record<string, unknown>, object2: Record<string, unknown>) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return !keys1.some((key) => (
    object1[key] !== object2[key]
  ));
}

const AutoSubmit = (): null => {
  const { initialValues, values, submitForm } = useFormikContext<Record<string, unknown>>();

  React.useEffect(() => {
    const timeoutID = setTimeout(() => {
      if (!shallowEqual(values, initialValues)) {
        submitForm();
      }
    }, 3000);

    return (() => {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
    });
  }, [initialValues, submitForm, values]);

  return null;
};

export default AutoSubmit;
