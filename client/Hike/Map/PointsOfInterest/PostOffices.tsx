import React, {
  useEffect, useState,
} from 'react';
import L from 'leaflet';
import Http from '@mortvola/http';
import { useMap } from 'react-leaflet';
import { PostOffice as PostOfficeResponse } from '../../../../common/ResponseTypes';
import { createIcon } from '../../mapUtils';
import { postoffice } from '../Icons';
import PoiMarker from './PoiMarker';
import PostOffice from '../../../state/PointsOfInterest/PostOffice';
import { useStores } from '../../../state/store';

type PropsType = {
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const PostOffices: React.FC<PropsType> = ({ show, bounds }) => {
  const { uiState } = useStores();
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const leafletMap = useMap();

  useEffect(() => {
    const queryPostOffices = async (b: L.LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<PostOfficeResponse[]>(`/api/post-offices?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();

        const markers = body.map((m) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          return new PostOffice(
            m.id, new L.LatLng(m.location[1], m.location[0]), uiState.hike.map,
          );
        });

        setPostOffices(markers);
      }
    };

    if (leafletMap.getZoom() < 8 || !show || bounds === null) {
      setPostOffices([]);
    }
    else {
      queryPostOffices(bounds);
    }
  }, [bounds, leafletMap, show, uiState.hike]);

  return (
    <>
      {
        postOffices.map((c) => (
          <PoiMarker
            marker={c.marker}
            key={c.id}
            icon={createIcon(postoffice)}
          />
        ))
      }
    </>
  );
};

export default PostOffices;
