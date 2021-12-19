import React, {
  useEffect, useState,
} from 'react';
import L from 'leaflet';
import Http from '@mortvola/http';
import { useMap } from 'react-leaflet';
import { createIcon } from '../../mapUtils';
import PoiMarker from './PoiMarker';
import { useStores } from '../../../state/store';
import Photo from '../../../state/PointsOfInterest/Photo';
import { PhotoProps } from '../../../../common/ResponseTypes';

type PropsType = {
  show: boolean,
  bounds: L.LatLngBounds | null,
}

const Photos: React.FC<PropsType> = ({ show, bounds }) => {
  const { uiState } = useStores();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const leafletMap = useMap();

  useEffect(() => {
    const queryCampsites = async (b: L.LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<PhotoProps[]>(`/api/poi/photos?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        const markers = body.map((m) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          return new Photo(
            m.id, new L.LatLng(m.location[1], m.location[0]), uiState.hike.map,
          );
        });

        setPhotos(markers);
      }
    };

    if (leafletMap.getZoom() < 8 || !show || bounds === null) {
      setPhotos([]);
    }
    else {
      queryCampsites(bounds);
    }
  }, [bounds, leafletMap, show, uiState.hike]);

  return (
    <>
      {
        photos.map((c) => (
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

export default Photos;
