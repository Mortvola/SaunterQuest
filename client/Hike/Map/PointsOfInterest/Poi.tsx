import React, { useEffect, useState } from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import MarkerCluster from '../MarkerCluster';
import Campsites from './Campsites';
import PostOffices from './PostOffices';
import Cities from './Cities';
import RvSites from './RvSites';
import { PoiSelections } from '../More/PoiSelector';
import Photos from './Photos';
import { HikeInterface } from '../../state/Types';

type PropsType = {
  hike: HikeInterface,
  selections: PoiSelections,
}

const Poi: React.FC<PropsType> = ({ hike, selections }) => {
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
    <>
      <Campsites hike={hike} bounds={bounds} show={selections.campsites ?? false} />
      <RvSites hike={hike} bounds={bounds} show={selections.rvSites ?? false} />
      <PostOffices hike={hike} bounds={bounds} show={selections.postOffices ?? false} />
      <Cities hike={hike} bounds={bounds} show={selections.cities ?? false} />
      <Photos hike={hike} bounds={bounds} show={selections.photos ?? false} />
    </>
  );
};

export default Poi;
