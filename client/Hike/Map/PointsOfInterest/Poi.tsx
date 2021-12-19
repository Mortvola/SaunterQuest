import React, { useEffect, useState } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import MarkerCluster from '../MarkerCluster';
import Campsites from './Campsites';
import PostOffices from './PostOffices';
import Cities from './Cities';
import RvSites from './RvSites';
import { PoiSelections } from '../More/PoiSelector';
import Photos from './Photos';

type PropsType = {
  selections: PoiSelections,
}

const Poi: React.FC<PropsType> = ({ selections }) => {
  const leafletMap = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  useMapEvent('moveend', () => {
    if (leafletMap.getZoom() < 8) {
      setBounds(null);
    }
    else {
      const newBounds = leafletMap.getBounds();
      if (bounds === null || !bounds.contains(newBounds)) {
        setBounds(newBounds);
      }
    }
  });

  useEffect(() => {
    if (leafletMap.getZoom() < 8) {
      setBounds(null);
    }
    else {
      setBounds(leafletMap.getBounds());
    }
  }, [leafletMap]);

  return (
    <MarkerCluster>
      <Campsites bounds={bounds} show={selections.campsites} />
      <RvSites bounds={bounds} show={selections.rvSites} />
      <PostOffices bounds={bounds} show={selections.postOffices} />
      <Cities bounds={bounds} show={selections.cities} />
      <Photos bounds={bounds} show={selections.photos} />
    </MarkerCluster>
  );
};

export default Poi;
