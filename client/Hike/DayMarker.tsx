import { toJS } from 'mobx';
import React, { ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import { Day } from '../state/Types';

type Props = {
  day: Day;
}

const DayMarker = ({
  day,
}: Props): ReactElement => {
  const text = `End of day ${day.day}`;

  return (
    <Marker
      position={toJS(day.latLng)}
      icon={day.marker.icon}
    >
      <Popup>
        {`${text}`}
      </Popup>
    </Marker>
  );
};

// DayMarker.propTypes = {
//   day: PropTypes.shape().isRequired,
// };

export default DayMarker;
