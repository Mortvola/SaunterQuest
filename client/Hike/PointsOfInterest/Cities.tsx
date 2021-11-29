import React, {
  useEffect, useState,
} from 'react';
import 'leaflet.markercluster';
import { LatLngBounds } from 'leaflet';
import Http from '@mortvola/http';
import { useMap, useMapEvent, Marker as LeafletMarker } from 'react-leaflet';
import { City } from '../../../common/ResponseTypes';
import { createIcon } from '../mapUtils';
import city from '../../images/city.svg';

type PropsType = {
  show: boolean,
}

const Cities: React.FC<PropsType> = ({ show }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const map = useMap();

  useEffect(() => {
    const queryCities = async (m: L.Map, b: LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<City[]>(`/api/cities?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        setCities(body);
      }
    };

    if (map.getZoom() < 8 || !show) {
      setCities([]);
    }
    else if (bounds !== null) {
      queryCities(map, bounds);
    }
  }, [bounds, map, show]);

  useMapEvent('moveend', () => {
    const newBounds = map.getBounds();
    if (bounds === null || !bounds.contains(newBounds)) {
      setBounds(newBounds);
    }
  });

  useEffect(() => {
    setBounds(map.getBounds());
  }, [map]);

  return (
    <>
      {
        cities.map((c) => (
          <LeafletMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon(city)}
            title={c.name}
          />
        ))
      }
    </>
  );
};

export default Cities;
