import React, { ReactElement, useRef } from 'react';
// import PropTypes from 'prop-types';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import useContextMenu, { MenuItems } from '@mortvola/leaflet-context-menu';
// import Route from '../state/Route';
// import Anchor from '../state/Markers/Anchor';
import { DomEvent, LeafletEvent } from 'leaflet';
import { createIcon } from '../mapUtils';
import { useStores } from '../../state/store';
import { useMarkerDialog } from './MarkerDialog';
import { MarkerInterface } from '../../state/Types';
import {
  compass, campsite, water, resupply, moon,
} from './Icons';

type Props = {
  marker: MarkerInterface,
  draggingLocked: boolean,
}

const Marker = ({
  marker,
  draggingLocked,
}: Props): ReactElement | null => {
  const { uiState } = useStores();
  const markerRef = useRef<L.Marker>(null);
  const [MarkerDialog, showMarkerDialog] = useMarkerDialog();

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

  let draggable = false;

  const icons = marker.types()
    .filter((type) => (
      (type !== 'day' || uiState.showMarkers.get('day'))
      && (type !== 'waypoint' || uiState.showMarkers.get('waypoint'))
      && (type !== 'water' || uiState.showMarkers.get('water'))
      && (type !== 'campsite' || uiState.showMarkers.get('campsite'))
      && (type !== 'resupply' || uiState.showMarkers.get('resupply'))
    ))
    .map((type) => {
      switch (type) {
        case 'waypoint':
          draggable = true;
          return compass;
        case 'campsite':
          draggable = true;
          return campsite;
        case 'day':
          return moon;
        case 'water':
          draggable = true;
          return water;
        case 'resupply':
          draggable = true;
          return resupply;
        default:
          return '';
      }
    });

  const popup = marker.popup();

  const label = marker.label();

  if (icons.length !== 0) {
    return (
      <>
        <ContextMenu />
        <MarkerDialog marker={marker} />
        <LeafletMarker
          ref={markerRef}
          position={marker.latLng}
          icon={createIcon(icons, label)}
          draggable={draggingLocked ? false : draggable}
          eventHandlers={{
            click: (event: LeafletEvent) => {
              showMarkerDialog();
              DomEvent.stop(event);
            },
            dragend: handleDragEnd,
            contextmenu: showContextMenu,
          }}
        >
          {
            popup
              ? (
                <Popup offset={[0, -12]}>
                  { popup }
                </Popup>
              )
              : null
          }
        </LeafletMarker>
      </>
    );
  }

  return null;
};

// Marker.propTypes = {
//   route: PropTypes.shape().isRequired,
//   waypoint: PropTypes.shape().isRequired,
// };

export default observer(Marker);
