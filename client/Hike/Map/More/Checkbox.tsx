/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styles from './Checkbox.module.css';

type PoiItemProps = {
  name?: string,
  label: string,
  checked?: boolean,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
}

const Checkbox: React.FC<PoiItemProps> = ({
  name, label, checked = false, onChange,
}) => (
  <label>
    <input className={styles.checkbox} type="checkbox" name={name} checked={checked} onChange={onChange} />
    {label}
  </label>
);

export default Checkbox;
