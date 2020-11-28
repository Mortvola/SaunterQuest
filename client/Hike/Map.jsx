import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
  Popup,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Route from './Route';
import DayMarker from './DayMarker';
import { useGotoLocationDialog } from './GotoLocationDialog';

const Map = observer(({
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

  const openContextMenu = (event) => {
    const mapMenuItems = [
      { text: 'Prepend Waypoint', callback: ({ latlng }) => hike.route.addStartWaypoint(latlng) },
      { text: 'Insert Waypoint', callback: ({ latlng }) => hike.route.addWaypoint(latlng) },
      { text: 'Append Waypoint', callback: ({ latlng }) => hike.route.addEndWaypoint(latlng) },
      { separator: true },
      { text: 'Go to Location...', callback: showGotoLocationDialog },
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
      <TileLayer
        url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
        zIndex="1"
        ref={terrainLayer}
      />
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
        zIndex="2"
        ref={detailLayer}
      />
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
    </>
  );
});

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

const MyMapContainer = ({
  tileServerUrl,
  hike,
  map,
  dayMarkers,
  locationPopup,
}) => (
  <MapContainer
    minZoom="4"
    maxZoom="16"
    center={[40, -90]}
    zoom="5"
  >
    <Map
      tileServerUrl={tileServerUrl}
      hike={hike}
      map={map}
      dayMarkers={dayMarkers}
      locationPopup={locationPopup}
    />
  </MapContainer>
);

MyMapContainer.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
  hike: PropTypes.shape().isRequired,
  map: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  locationPopup: PropTypes.shape(),
};

MyMapContainer.defaultProps = {
  map: null,
  dayMarkers: null,
  locationPopup: null,
};

export default MyMapContainer;
