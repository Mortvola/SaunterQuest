import React, { ReactElement, useRef } from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import { MenuItems, showContextMenu } from '@mortvola/leaflet-context-menu';
import { DomEvent, LeafletEvent, LeafletMouseEvent } from 'leaflet';
import useMediaQuery from '../../MediaQuery';
import { createIcon } from '../mapUtils';
import { useStores } from '../../state/store';
import { PointOfInterestInterface } from '../../state/Types';
import { PoiSelections } from './More/PoiSelector';

type Props = {
  marker: PointOfInterestInterface,
  draggingLocked: boolean,
  selections: PoiSelections,
}

const Marker = ({
  marker,
  draggingLocked,
  selections,
}: Props): ReactElement | null => {
  const { uiState } = useStores();
  const markerRef = useRef<L.Marker>(null);
  const { isMobile } = useMediaQuery();

  const handleDragEnd = () => {
    const leafletMarker = markerRef.current;
    if (leafletMarker !== null) {
      marker.marker.move(leafletMarker.getLatLng());
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

  let draggable = false;

  const icons = marker.marker.types()
    .filter((type) => (
      (type !== 'day' || selections.day)
      && (type !== 'waypoint' || selections.waypoints)
      && (type !== 'start' || selections.waypoints)
      && (type !== 'finish' || selections.waypoints)
      && (type !== 'water' || uiState.showMarkers.get('water'))
      && (type !== 'campsite' || uiState.showMarkers.get('campsite'))
      && (type !== 'resupply' || uiState.showMarkers.get('resupply'))
    ))
    .map((type) => {
      switch (type) {
        case 'start':
          draggable = true;
          break;
        case 'finish':
          draggable = true;
          break;
        case 'waypoint':
          draggable = true;
          break;
        case 'campsite':
          draggable = true;
          break;
        case 'day':
          break;
        case 'water':
          draggable = true;
          break;
        case 'resupply':
          draggable = true;
          break;
        default:
          break;
      }

      return marker.getIcon();
    });

  const popup = marker.marker.popup();

  const label = marker.marker.getLabel();

  if (icons.length !== 0) {
    return (
      <LeafletMarker
        ref={markerRef}
        position={marker.marker.latLng}
        icon={createIcon(icons, label)}
        draggable={draggingLocked ? false : draggable}
        eventHandlers={{
          click: (event: LeafletEvent) => {
            if (uiState.hike && uiState.hike.currentLeg) {
              uiState.hike.currentLeg.map.clearSelectedMarkers();
            }
            marker.setSelected(true);
            DomEvent.stop(event);
          },
          dragend: handleDragEnd,
          contextmenu: (e: LeafletMouseEvent) => {
            if (!isMobile) {
              showContextMenu(makeContextMenu)(e);
            }
          },
        }}
      />
    );
  }

  return null;
};

export default observer(Marker);
