import React, { ReactElement } from 'react';
import { MapContainer } from 'react-leaflet';
import Map from './Map';
import Hike from '../../state/Hike';
import './MapDrawer';
import useMediaQuery from '../../MediaQuery';

type Props = {
  tileServerUrl: string;
  pathFinderUrl: string;
  hike: Hike;
  locationPopup: L.LatLng | null;
}

const MyMapContainer = ({
  tileServerUrl,
  pathFinderUrl,
  hike,
  locationPopup,
}: Props): ReactElement => {
  const { isMobile } = useMediaQuery();

  return (
    <MapContainer
      zoomControl={!isMobile}
      minZoom={4}
      maxZoom={16}
      center={[40, -90]}
      zoom={5}
      contextMenuTimeout={610}
    >
      <Map
        tileServerUrl={tileServerUrl}
        pathFinderUrl={pathFinderUrl}
        hike={hike}
        locationPopup={locationPopup}
      />
    </MapContainer>
  );
};

export default MyMapContainer;
