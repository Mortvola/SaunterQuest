import React, {
  useEffect, useState,
} from 'react';
import L from 'leaflet';
import Http from '@mortvola/http';
import { useMap } from 'react-leaflet';
import { Campsite as CampsiteResponse } from '../../../../common/ResponseTypes';
import { createIcon } from '../../mapUtils';
import PoiMarker from './PoiMarker';
import Campsite from '../../state/PointsOfInterest/Campsite';
import { HikeInterface } from '../../state/Types';

type PropsType = {
  hike: HikeInterface,
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const Campsites: React.FC<PropsType> = ({ hike, show, bounds }) => {
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
          if (!hike) {
            throw new Error('hike is null');
          }

          if (hike.currentLeg === null) {
            throw new Error('currentLeg is null');
          }

          return new Campsite(
            m.id, m.name, new L.LatLng(m.location[1], m.location[0]), hike.currentLeg.map,
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
  }, [bounds, leafletMap, show, hike]);

  return (
    <>
      {
        campsites.map((c) => (
          <PoiMarker
            hike={hike}
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
