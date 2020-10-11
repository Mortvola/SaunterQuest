import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { moveWaypoint } from '../redux/actions';

const Waypoint = ({
  hikeId,
  waypoint,
  dispatch,
}) => {
  const markerRef = useRef(null);
  const handleDragEnd = () => {
    dispatch(moveWaypoint(hikeId, waypoint, markerRef.current.getLatLng()));
  };

  return (
    <Marker
      ref={markerRef}
      position={waypoint}
      icon={waypoint.marker.icon}
      draggable
      eventHandlers={{
        dragend: handleDragEnd,
      }}
    />
  );
};

Waypoint.propTypes = {
  hikeId: PropTypes.number.isRequired,
  waypoint: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default Waypoint;
