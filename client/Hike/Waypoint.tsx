import React, { ReactElement, useRef } from 'react';
// import PropTypes from 'prop-types';
import { Marker } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Route from '../state/Route';
import Anchor from '../state/Anchor';
import useContextMenu from '../../Utilities/ContextMenu';
import { useWaypointDialog } from './WaypointDialog';
import { createIcon } from './mapUtils';

type Props = {
  route: Route;
  waypoint: Anchor;
}

const Waypoint = ({
  route,
  waypoint,
}: Props): ReactElement => {
  const markerRef = useRef<L.Marker>(null);
  const [WaypointDialog, showWaypointDialog] = useWaypointDialog();

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
      { label: 'Modify...', callback: showWaypointDialog },
      { label: 'Remove Waypoint', callback: removeWaypoint },
    ];

    return menuItems;
  };

  const [ContextMenu, showContextMenu] = useContextMenu('marker', makeContextMenu, 'main');

  const icons = ['compass.svg'];
  if (waypoint.campsite) {
    icons.push('campsite.svg');
  }

  return (
    <>
      <ContextMenu />
      <Marker
        ref={markerRef}
        position={waypoint.latLng}
        icon={createIcon(icons)}
        draggable
        eventHandlers={{
          dragend: handleDragEnd,
          contextmenu: showContextMenu,
        }}
      />
      <WaypointDialog waypoint={waypoint} />
    </>
  );
};

// Waypoint.propTypes = {
//   route: PropTypes.shape().isRequired,
//   waypoint: PropTypes.shape().isRequired,
// };

export default observer(Waypoint);
