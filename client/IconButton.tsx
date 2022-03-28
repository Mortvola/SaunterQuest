import React from 'react';
import styles from './IconButton.module.css';

type PropsType = {
  icon: string;
  invert?: boolean,
  rotate?: boolean;
  className?: string,
  style?: React.CSSProperties,
  onClick?: () => void;
}

const IconButton: React.FC<PropsType> = ({
  icon,
  invert,
  rotate,
  onClick,
  className = '',
  style,
}) => {
  let iconClassName = `fas fa-${icon}`;

  if (rotate) {
    iconClassName += ' rotate';
  }

  let invertClass = '';
  if (invert) {
    invertClass += ` ${styles.invert}`;
  }

  return (
    <div
      className={`btn btn-sm ${styles.iconButton} ${invertClass} ${className}`}
      onClick={onClick}
      style={style && style}
    >
      <i className={iconClassName} />
    </div>
  );
};

export default IconButton;
