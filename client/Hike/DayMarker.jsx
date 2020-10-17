import React from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';

const DayMarker = ({
  day,
}) => {
  const text = `End of day ${day.day}`;

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
