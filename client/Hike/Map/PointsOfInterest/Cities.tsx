import React, {
  useEffect, useState,
} from 'react';
import L from 'leaflet';
import Http from '@mortvola/http';
import { useMap } from 'react-leaflet';
import { City as CityResponse } from '../../../../common/ResponseTypes';
import { createIcon } from '../../mapUtils';
import { city } from '../Icons';
import { useStores } from '../../../state/store';
import PoiMarker from './PoiMarker';
import City from '../../../state/PointsOfInterest/City';

type PropsType = {
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const Cities: React.FC<PropsType> = ({ show, bounds }) => {
  const { uiState } = useStores();
  const [cities, setCities] = useState<City[]>([]);
  const leafletMap = useMap();

  useEffect(() => {
    const queryCities = async (b: L.LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<CityResponse[]>(`/api/cities?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();

        const markers = body.map((m) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          return new City(
            m.id, m.name, new L.LatLng(m.location[1], m.location[0]), uiState.hike.map,
          );
        });

        setCities(markers);
      }
    };

    if (leafletMap.getZoom() < 8 || !show || bounds === null) {
      setCities([]);
    }
    else {
      queryCities(bounds);
    }
  }, [bounds, leafletMap, show, uiState.hike]);

  return (
    <>
      {
        cities.map((c) => (
          <PoiMarker
            marker={c.marker}
            key={c.id}
            icon={createIcon(city)}
            title={c.name}
          />
        ))
      }
    </>
  );
};

export default Cities;
