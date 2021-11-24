import React, { ReactElement, useRef } from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import { MenuItems, showContextMenu } from '@mortvola/leaflet-context-menu';
import { DomEvent, LeafletEvent, LeafletMouseEvent } from 'leaflet';
import useMediaQuery from '../../MediaQuery';
import { createIcon } from '../mapUtils';
import { useStores } from '../../state/store';
import { useMarkerDialog } from './MarkerDialog';
import { MarkerInterface } from '../../state/Types';
import * as Icons from './Icons';
import { PoiSelections } from './More/PoiSelector';

type Props = {
  marker: MarkerInterface,
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
  const [MarkerDialog, showMarkerDialog] = useMarkerDialog();
  const { isMobile } = useMediaQuery();

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

  let draggable = false;

  const icons = marker.types()
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
          return Icons.start;
        case 'finish':
          draggable = true;
          return Icons.finish;
        case 'waypoint':
          draggable = true;
          return Icons.compass;
        case 'campsite':
          draggable = true;
          return Icons.campsite;
        case 'day':
          return Icons.moon;
        case 'water':
          draggable = true;
          return Icons.water;
        case 'resupply':
          draggable = true;
          return Icons.resupply;
        default:
          return '';
      }
    });

  const popup = marker.popup();

  const label = marker.label();

  if (icons.length !== 0) {
    return (
      <>
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
            contextmenu: (e: LeafletMouseEvent) => {
              if (!isMobile) {
                showContextMenu(makeContextMenu)(e);
              }
            },
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

export default observer(Marker);
