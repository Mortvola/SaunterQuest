import React from 'react';
import { FieldError } from '../../common/ResponseTypes';

let key = 0;

type PropsType = {
  errors: FieldError[],
}

const Errors: React.FC<PropsType> = ({
  errors,
}) => (
  <>
    {
      errors.map((e) => {
        key += 1;
        return <div key={key} style={{ fontSize: 'small' }}>{e.message}</div>;
      })
    }
  </>
);

export default Errors;
