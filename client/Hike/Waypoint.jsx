import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { observer } from 'mobx-react-lite';

const Waypoint = ({
  route,
  waypoint,
}) => {
  const markerRef = useRef(null);
  const handleDragEnd = () => {
    route.moveWaypoint(waypoint.id, markerRef.current.getLatLng());
  };

  const handleDelete = () => {
    route.deleteWaypoint(waypoint.id);
  };

  return (
    <Marker
      ref={markerRef}
      position={{ lat: waypoint.lat, lng: waypoint.lng }}
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
  route: PropTypes.shape().isRequired,
  waypoint: PropTypes.shape().isRequired,
};

export default observer(Waypoint);
