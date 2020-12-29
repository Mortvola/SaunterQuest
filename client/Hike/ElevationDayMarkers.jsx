import React from 'react';
import PropTypes from 'prop-types';
import ElevationDayMarker from './ElevationDayMarker';

const ElevationDayMarkers = ({
  days,
  chart,
}) => {
  if (days && chart) {
    return (
      <>
        {
          days.map((d) => (
            <ElevationDayMarker key={d.day} day={d} chart={chart} />
          ))
        }
      </>
    );
  }

  return null;
};

ElevationDayMarkers.propTypes = {
  days: PropTypes.arrayOf(PropTypes.shape()),
  chart: PropTypes.shape(),
};

ElevationDayMarkers.defaultProps = {
  days: null,
  chart: null,
};

export default ElevationDayMarkers;
