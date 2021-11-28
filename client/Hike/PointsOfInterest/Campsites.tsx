import React, {
  useEffect, useState,
} from 'react';
import 'leaflet.markercluster';
import { LatLngBounds } from 'leaflet';
import Http from '@mortvola/http';
import { useMap, useMapEvent, Marker as LeafletMarker } from 'react-leaflet';
import { Campsite, isCampsiteResponse } from '../../../common/ResponseTypes';
import { createIcon } from '../mapUtils';
import campsite from '../../images/campsite.svg';

const Campsites: React.FC = () => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const map = useMap();

  useEffect(() => {
    const queryCampsites = async (m: L.Map, b: LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get(`/api/campsites?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        if (isCampsiteResponse(body)) {
          setCampsites(body);
        }
      }
    };

    if (map.getZoom() < 8) {
      setCampsites([]);
    }
    else if (bounds !== null) {
      queryCampsites(map, bounds);
    }
  }, [bounds, map]);

  useMapEvent('moveend', () => setBounds(map.getBounds()));

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map]);

  return (
    <>
      {
        campsites.map((c) => (
          <LeafletMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon(campsite)}
            title={c.name}
          />
        ))
      }
    </>
  );
};

export default Campsites;
