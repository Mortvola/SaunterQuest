import React, { useState, useRef } from 'react';
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

const Map = ({
  tileServerUrl,
  hike,
  map,
  dayMarkers,
  locationPopup,
}) => {
  const leafletMap = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();
  const [TerrainDialog, showTerrainDialog] = useTerrainDialog();
  const [latLng, setLatLng] = useState(null);

  const findSteepestPoint = () => {
    const steepestPoint = hike.route.findSteepestPoint();
    console.log(JSON.stringify(steepestPoint));
  };

  const openContextMenu = (event) => {
    const mapMenuItems = [
      { text: 'Prepend Waypoint', callback: ({ latlng }) => hike.route.addStartWaypoint(latlng) },
      { text: 'Insert Waypoint', callback: ({ latlng }) => hike.route.addWaypoint(latlng) },
      { text: 'Append Waypoint', callback: ({ latlng }) => hike.route.addEndWaypoint(latlng) },
      { separator: true },
      {
        text: 'Show Location in 3D',
        callback: (e) => {
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

  const closeContextMenu = (event) => {
    event.target.contextmenu.hide();
  };

  useMapEvents({
    contextmenu: openContextMenu,
    click: closeContextMenu,
  });

  const handleLocationPopupClose = () => {
    map.showLocationPopup(null);
  };

  return (
    <>
      <LayersControl position="topleft">
        <LayersControl.Overlay checked name="Terrain">
          <TileLayer
            url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
            zIndex="1"
            ref={terrainLayer}
          />
        </LayersControl.Overlay>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
          zIndex="2"
          ref={detailLayer}
        />
      </LayersControl>
      <Route route={hike.route} />
      {
        dayMarkers
          ? dayMarkers.map((d) => (
            <DayMarker key={d.id} day={d} />
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

Map.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
  hike: PropTypes.shape().isRequired,
  map: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  locationPopup: PropTypes.shape(),
};

Map.defaultProps = {
  map: null,
  dayMarkers: null,
  locationPopup: null,
};

export default observer(Map);
