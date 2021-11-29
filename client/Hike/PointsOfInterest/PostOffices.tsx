import React, {
  useEffect, useState,
} from 'react';
import 'leaflet.markercluster';
import { LatLngBounds } from 'leaflet';
import Http from '@mortvola/http';
import { useMap, useMapEvent, Marker as LeafletMarker } from 'react-leaflet';
import { PostOffice } from '../../../common/ResponseTypes';
import { createIcon } from '../mapUtils';
import postoffice from '../../images/postoffice.svg';

type PropsType = {
  show: boolean,
}

const PostOffices: React.FC<PropsType> = ({ show }) => {
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const map = useMap();

  useEffect(() => {
    const queryPostOffices = async (m: L.Map, b: LatLngBounds) => {
      const b2 = {
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      };

      const response = await Http.get<PostOffice[]>(`/api/post-offices?n=${b2.north}&s=${b2.south}&e=${b2.east}&w=${b2.west}`);

      if (response.ok) {
        const body = await response.body();
        setPostOffices(body);
      }
    };

    if (map.getZoom() < 8 || !show) {
      setPostOffices([]);
    }
    else if (bounds !== null) {
      queryPostOffices(map, bounds);
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
        postOffices.map((c) => (
          <LeafletMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon(postoffice)}
          />
        ))
      }
    </>
  );
};

export default PostOffices;
