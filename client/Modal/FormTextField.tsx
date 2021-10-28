import React, { ReactElement } from 'react';
import { Field } from 'formik';
import FormError from './FormError';

type PropsType = {
  name: string,
  label?: string,
  readOnly?: boolean,
};

const FormTextField = ({
  name,
  label,
  readOnly,
}: PropsType): ReactElement => (
  <label style={{ userSelect: 'none', marginTop: '0.5rem' }}>
    {label}
    <Field
      type="text"
      className="form-control"
      readOnly={readOnly}
      name={name}
    />
    <FormError name={name} />
  </label>
);

export default FormTextField;
