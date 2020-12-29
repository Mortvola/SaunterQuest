import React from 'react';
import PropTypes from 'prop-types';

const ElevationDayMarker = ({
  day,
  chart,
}) => {
  const cli = chart.getChartLayoutInterface();
  const x = `${cli.getXLocation(day.miles) - 15}px`;
  const y = `${cli.getYLocation(day.ele) - 32}px`;

  return (
    <img src="moon_pin.png" alt="" style={{ top: y, left: x, position: 'absolute' }} />
  );
};

ElevationDayMarker.propTypes = {
  day: PropTypes.shape().isRequired,
  chart: PropTypes.shape().isRequired,
};

export default ElevationDayMarker;
