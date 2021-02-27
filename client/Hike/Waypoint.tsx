import React, { ReactElement, useRef } from 'react';
// import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Route from '../state/Route';
import Anchor from '../state/Anchor';
import useContextMenu from '../../Utilities/ContextMenu';

type Props = {
  route: Route;
  waypoint: Anchor;
}

const Waypoint = ({
  route,
  waypoint,
}: Props): ReactElement => {
  const markerRef = useRef<L.Marker>(null);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker !== null) {
      route.moveWaypoint(waypoint.id, marker.getLatLng());
    }
  };

  const removeWaypoint = () => {
    route.deleteWaypoint(waypoint.id);
  };

  const makeContextMenu = () => {
    const menuItems = [
      { label: 'Remove Waypoint', callback: removeWaypoint },
    ];

    return menuItems;
  };

  const [ContextMenu, showContextMenu] = useContextMenu('marker', makeContextMenu, 'main');

  return (
    <>
      <ContextMenu />
      <Marker
        ref={markerRef}
        position={waypoint.latLng}
        icon={waypoint.marker.icon}
        draggable
        eventHandlers={{
          dragend: handleDragEnd,
          contextmenu: showContextMenu,
        }}
      />
    </>
  );
};

// Waypoint.propTypes = {
//   route: PropTypes.shape().isRequired,
//   waypoint: PropTypes.shape().isRequired,
// };

export default observer(Waypoint);
