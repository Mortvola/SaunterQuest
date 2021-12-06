import React, {
  useEffect, useState,
} from 'react';
import L from 'leaflet';
import Http from '@mortvola/http';
import { useMap } from 'react-leaflet';
import { Campsite as CampsiteResponse } from '../../../../common/ResponseTypes';
import { createIcon } from '../../mapUtils';
import PoiMarker from './PoiMarker';
import { useStores } from '../../../state/store';
import Campsite from '../../../state/PointsOfInterest/Campsite';

type PropsType = {
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const Campsites: React.FC<PropsType> = ({ show, bounds }) => {
  const { uiState } = useStores();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const leafletMap = useMap();

  useEffect(() => {
    const queryCampsites = async (b: L.LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<CampsiteResponse[]>(`/api/campsites?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        const markers = body.map((m) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          return new Campsite(
            m.id, m.name, new L.LatLng(m.location[1], m.location[0]), uiState.hike.map,
          );
        });

        setCampsites(markers);
      }
    };

    if (leafletMap.getZoom() < 8 || !show || bounds === null) {
      setCampsites([]);
    }
    else {
      queryCampsites(bounds);
    }
  }, [bounds, leafletMap, show, uiState.hike]);

  return (
    <>
      {
        campsites.map((c) => (
          <PoiMarker
            marker={c}
            key={c.id}
            icon={createIcon(c.getIcon())}
            title={c.name}
          />
        ))
      }
    </>
  );
};

export default Campsites;
