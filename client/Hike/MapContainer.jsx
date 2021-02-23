import React from 'react';
import PropTypes from 'prop-types';
import { MapContainer } from 'react-leaflet';
import Map from './Map';

const MyMapContainer = ({
  tileServerUrl,
  hike,
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
      locationPopup={locationPopup}
    />
  </MapContainer>
);

MyMapContainer.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
  hike: PropTypes.shape().isRequired,
  locationPopup: PropTypes.shape(),
};

MyMapContainer.defaultProps = {
  locationPopup: null,
};

export default MyMapContainer;
