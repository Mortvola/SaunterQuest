import React, { ReactElement } from 'react';
import { MapContainer } from 'react-leaflet';
import Map from './Map';
import Hike from '../state/Hike';
import './MapDrawer';
import useMediaQuery from '../../MediaQuery';

type Props = {
  tileServerUrl: string;
  hike: Hike;
  locationPopup: L.LatLng | null;
  style: React.CSSProperties;
}

const MyMapContainer = ({
  tileServerUrl,
  hike,
  locationPopup,
  style,
}: Props): ReactElement => {
  const { isMobile } = useMediaQuery();

  return (
    <MapContainer
      zoomControl={!isMobile}
      minZoom={4}
      maxZoom={16}
      center={[40, -90]}
      zoom={5}
      style={style}
    >
      <Map
        tileServerUrl={tileServerUrl}
        hike={hike}
        locationPopup={locationPopup}
      />
    </MapContainer>
  );
};

export default MyMapContainer;
