import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
  Popup,
} from 'react-leaflet';
import Route from './Route';
import {
  addStartWaypoint, addWaypoint, addEndWaypoint, showLocationPopup,
} from '../redux/actions';
import DayMarker from './DayMarker';
import { useGotoLocationDialog } from './GotoLocationDialog';

const Map = ({
  tileServerUrl,
  hikeId,
  route,
  bounds,
  dayMarkers,
  locationPopup,
  dispatch,
}) => {
  const map = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();

  const openContextMenu = (event) => {
    const mapMenuItems = [
      { text: 'Prepend Waypoint', callback: ({ latlng }) => dispatch(addStartWaypoint(hikeId, latlng)) },
      { text: 'Insert Waypoint', callback: ({ latlng }) => dispatch(addWaypoint(hikeId, latlng)) },
      { text: 'Append Waypoint', callback: ({ latlng }) => dispatch(addEndWaypoint(hikeId, latlng)) },
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
    dispatch(showLocationPopup(null));
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
      <Route hikeId={hikeId} route={route} bounds={bounds} dispatch={dispatch} />
      {
        dayMarkers
          ? dayMarkers.map((d) => (
            <DayMarker key={d.id} day={d} />
          ))
          : null
      }
      <GotoLocationDialog map={map} dispatch={dispatch} />
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
};

Map.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
  hikeId: PropTypes.number.isRequired,
  route: PropTypes.arrayOf(PropTypes.shape()),
  bounds: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  dispatch: PropTypes.func.isRequired,
  locationPopup: PropTypes.shape(),
};

Map.defaultProps = {
  route: null,
  bounds: null,
  dayMarkers: null,
  locationPopup: null,
};

const MyMapContainer = ({
  tileServerUrl,
  hikeId,
  route,
  bounds,
  dayMarkers,
  locationPopup,
  dispatch,
}) => (
  <MapContainer
    minZoom="4"
    maxZoom="16"
    center={[40, -90]}
    zoom="5"
  >
    <Map
      tileServerUrl={tileServerUrl}
      hikeId={hikeId}
      route={route}
      bounds={bounds}
      dayMarkers={dayMarkers}
      locationPopup={locationPopup}
      dispatch={dispatch}
    />
  </MapContainer>
);

MyMapContainer.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
  hikeId: PropTypes.number.isRequired,
  route: PropTypes.arrayOf(PropTypes.shape()),
  bounds: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  locationPopup: PropTypes.shape(),
  dispatch: PropTypes.func.isRequired,
};

MyMapContainer.defaultProps = {
  route: null,
  bounds: null,
  dayMarkers: null,
  locationPopup: null,
};

export default MyMapContainer;
