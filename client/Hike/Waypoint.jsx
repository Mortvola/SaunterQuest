import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { moveWaypoint, deleteWaypoint } from '../redux/actions';

const Waypoint = ({
  hikeId,
  waypoint,
  dispatch,
}) => {
  const markerRef = useRef(null);
  const handleDragEnd = () => {
    dispatch(moveWaypoint(hikeId, waypoint, markerRef.current.getLatLng()));
  };

  const handleDelete = () => {
    dispatch(deleteWaypoint(hikeId, waypoint.id));
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
      contextmenu="true"
      contextmenuItems={[{
        text: 'Delete',
        index: 0,
        callback: handleDelete,
      }, {
        separator: true,
        index: 1,
      }]}
    />
  );
};

Waypoint.propTypes = {
  hikeId: PropTypes.number.isRequired,
  waypoint: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default Waypoint;
