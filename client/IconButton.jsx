import React from 'react';
import PropTypes from 'prop-types';

const IconButton = ({
  icon,
  invert,
  rotate,
  onClick,
  className,
  style,
}) => {
  let iconClassName = `fas fa-${icon}`;

  if (rotate) {
    iconClassName += ' rotate';
  }

  let invertClass = '';
  if (invert) {
    invertClass += ' invert';
  }

  return (
    <div
      className={`btn btn-sm icon-button ${invertClass} ${className}`}
      onClick={onClick}
      style={style && style}
    >
      <i className={iconClassName} />
    </div>
  );
};

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  invert: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  rotate: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.shape(),
};

IconButton.defaultProps = {
  className: '',
  rotate: false,
  invert: false,
  style: null,
};

export default IconButton;
