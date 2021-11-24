/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import styles from './MoreItem.module.css';

type MoreItemProps = {
  label: string,
  expanded?: boolean,
  onClick?: React.MouseEventHandler,
  children?: React.ReactNode,
}

const MoreItem: React.FC<MoreItemProps> = ({
  label,
  expanded = false,
  onClick,
  children,
}) => (
  <div className={styles.item} onClick={onClick}>
    {label}
    {
      expanded
        ? children
        : null
    }
  </div>
);

export default MoreItem;
