import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import Route from './Route';
import { addStartWaypoint, addWaypoint, addEndWaypoint } from '../redux/actions';
import DayMarker from './DayMarker';

const Map = ({
  tileServerUrl,
  hikeId,
  route,
  bounds,
  dayMarkers,
  dispatch,
}) => {
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);

  const openContextMenu = (event) => {
    const mapMenuItems = [
      { text: 'Prepend Waypoint', callback: ({ latlng }) => dispatch(addStartWaypoint(hikeId, latlng)) },
      { text: 'Insert Waypoint', callback: ({ latlng }) => dispatch(addWaypoint(hikeId, latlng)) },
      { text: 'Append Waypoint', callback: ({ latlng }) => dispatch(addEndWaypoint(hikeId, latlng)) },
      { separator: true },
      { text: 'Go to Location...', callback: null }, // gotoLocation },
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
};

Map.defaultProps = {
  route: null,
  bounds: null,
  dayMarkers: null,
};

const MyMapContainer = ({
  tileServerUrl,
  hikeId,
  route,
  bounds,
  dayMarkers,
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
  dispatch: PropTypes.func.isRequired,
};

MyMapContainer.defaultProps = {
  route: null,
  bounds: null,
  dayMarkers: null,
};

export default MyMapContainer;
