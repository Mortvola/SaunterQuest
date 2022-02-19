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
import RV from '../../../state/PointsOfInterest/RV';

type PropsType = {
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const RvSites: React.FC<PropsType> = ({ show, bounds }) => {
  const { uiState } = useStores();
  const [sites, setSites] = useState<RV[]>([]);
  const leafletMap = useMap();

  useEffect(() => {
    const queryCampsites = async (b: L.LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<CampsiteResponse[]>(`/api/poi/rv?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        const markers = body.map((m) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          if (uiState.hike.currentLeg === null) {
            throw new Error('currentLeg is null');
          }

          return new RV(
            m.id, m.name, new L.LatLng(m.location[1], m.location[0]), uiState.hike.currentLeg.map,
          );
        });

        setSites(markers);
      }
    };

    if (leafletMap.getZoom() < 8 || !show || bounds === null) {
      setSites([]);
    }
    else {
      queryCampsites(bounds);
    }
  }, [bounds, leafletMap, show, uiState.hike]);

  return (
    <>
      {
        sites.map((c) => (
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

export default RvSites;
