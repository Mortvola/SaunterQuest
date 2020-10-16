import React from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';

const DayMarker = ({
  day,
}) => {
  let text = `End of day ${day.day}`;

  if (day.day === 0) {
    text = 'Start of day 1';
  }

  return (
    <Marker
      position={day}
      icon={day.marker.icon}
    >
      <Popup>
        {`${text}`}
      </Popup>
    </Marker>
  );
};

DayMarker.propTypes = {
  day: PropTypes.shape().isRequired,
};

export default DayMarker;
