import React, { ReactElement, useRef } from 'react';
// import PropTypes from 'prop-types';
import { Marker as LeafletMarker } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Route from '../state/Route';
import Anchor from '../state/Markers/Anchor';
import useContextMenu, { MenuItems } from '../../Utilities/ContextMenu';
// import { useWaypointDialog } from './WaypointDialog';
import { createIcon } from './mapUtils';
import MapMarker from '../state/MapMarker';

type Props = {
  marker: MapMarker;
}

const Marker = ({
  marker,
}: Props): ReactElement => {
  const markerRef = useRef<L.Marker>(null);
  // const [WaypointDialog, showWaypointDialog] = useWaypointDialog();

  const handleDragEnd = () => {
    const leafletMarker = markerRef.current;
    if (leafletMarker !== null) {
      marker.move(leafletMarker.getLatLng());
    }
  };

  // const removeWaypoint = () => {
  //   route.deleteWaypoint(waypoint.id);
  // };

  const makeContextMenu = () => {
    const menuItems: MenuItems = [
      // { label: 'Modify...', callback: showWaypointDialog },
      // { label: 'Remove Waypoint', callback: removeWaypoint },
    ];

    return menuItems;
  };

  const [ContextMenu, showContextMenu] = useContextMenu('marker', makeContextMenu, 'main');

  const icons = marker.types().map((type) => {
    switch (type) {
      case 'waypoint':
        return 'compass.svg';
      case 'campsite':
        return 'campsite.svg';
      case 'day':
        return 'moon.svg';
      default:
        return '';
    }
  });

  return (
    <>
      <ContextMenu />
      <LeafletMarker
        ref={markerRef}
        position={marker.latLng}
        icon={createIcon(icons)}
        draggable
        eventHandlers={{
          dragend: handleDragEnd,
          contextmenu: showContextMenu,
        }}
      />
    </>
  );
};

// Marker.propTypes = {
//   route: PropTypes.shape().isRequired,
//   waypoint: PropTypes.shape().isRequired,
// };

export default observer(Marker);
