import React from 'react';
import PropTypes from 'prop-types';
import { MapContainer } from 'react-leaflet';
import Map from './Map';

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
