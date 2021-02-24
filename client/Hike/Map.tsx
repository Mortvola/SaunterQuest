import React, { useState, useRef, ReactElement } from 'react';
import PropTypes from 'prop-types';
import {
  TileLayer,
  useMapEvents,
  useMap,
  Popup,
  LayersControl,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Route from './Route';
import DayMarker from './DayMarker';
import { useGotoLocationDialog } from './GotoLocationDialog';
import { useTerrainDialog } from './TerrainDialog';
import Graticule from './Graticule';
import Hike from '../state/Hike';
import { LatLng } from '../state/Types';

type Props = {
  tileServerUrl: string;
  hike: Hike,
  // eslint-disable-next-line react/require-default-props
  locationPopup?: LatLng | null,
};

const Map = ({
  tileServerUrl,
  hike,
  locationPopup,
}: Props): ReactElement => {
  const leafletMap = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();
  const [TerrainDialog, showTerrainDialog] = useTerrainDialog();
  const [latLng, setLatLng] = useState<LatLng | null>(null);

  const findSteepestPoint = () => {
    const steepestPoint = hike.route.findSteepestPoint();
    console.log(JSON.stringify(steepestPoint));
  };

  const openContextMenu = (event: L.LeafletMouseEvent) => {
    const mapMenuItems = [
      { text: 'Prepend Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addStartWaypoint(latlng) },
      { text: 'Insert Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addWaypoint(latlng) },
      { text: 'Append Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addEndWaypoint(latlng) },
      { separator: true },
      {
        text: 'Show Location in 3D',
        callback: (e: L.LeafletMouseEvent) => {
          setLatLng(e.latlng);
          showTerrainDialog();
        },
      },
      { text: 'Go to Location...', callback: showGotoLocationDialog },
      { text: 'Find Steepest Point', callback: findSteepestPoint },
    ];

    event.target.contextmenu.removeAllItems();

    mapMenuItems.forEach((i) => {
      event.target.contextmenu.addItem(i);
    });

    event.target.contextmenu.showAt(event.latlng);
  };

  const closeContextMenu = (event: L.LeafletMouseEvent) => {
    event.target.contextmenu.hide();
  };

  useMapEvents({
    contextmenu: openContextMenu,
    click: closeContextMenu,
  });

  const handleLocationPopupClose = () => {
    if (hike.map === null) {
      throw new Error('map in hike is null');
    }

    hike.map.showLocationPopup(null);
  };

  return (
    <>
      <LayersControl position="topleft">
        <LayersControl.Overlay checked name="Terrain">
          <TileLayer
            url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
            zIndex={1}
            ref={terrainLayer}
          />
        </LayersControl.Overlay>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
          zIndex={2}
          ref={detailLayer}
        />
        <LayersControl.Overlay checked name="Graticule">
          <Graticule />
        </LayersControl.Overlay>
      </LayersControl>
      <Route route={hike.route} />
      {
        hike.schedule
          ? hike.schedule.map((d, index) => (
            index > 0
              ? <DayMarker key={d.id} day={d} />
              : null
          ))
          : null
      }
      <GotoLocationDialog leafletMap={leafletMap} hike={hike} />
      {
        locationPopup
          ? (
            <Popup onClose={handleLocationPopupClose} position={locationPopup}>
              { `${locationPopup.lat}, ${locationPopup.lng}`}
            </Popup>
          )
          : null
      }
      <TerrainDialog latLng={latLng} />
    </>
  );
};

// Map.propTypes = {
//   tileServerUrl: PropTypes.string.isRequired,
//   hike: PropTypes.shape().isRequired,
//   map: PropTypes.shape(),
//   dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
//   locationPopup: PropTypes.shape(),
// };

// Map.defaultProps = {
//   map: null,
//   dayMarkers: null,
//   locationPopup: null,
// };

export default observer(Map);
