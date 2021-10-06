import React, { ReactElement, useEffect, useState } from 'react';
import Http from '@mortvola/http';
import { useMapEvent, Marker as LeafletMarker } from 'react-leaflet';
import { Campsite, isCampsiteResponse } from '../ResponseTypes';
import { createIcon } from './mapUtils';

const Campsites = (): ReactElement => {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [bounds, setBounds] = useState<{
    east: number, west: number, north: number, south: number,
  } | null>(null);

  const map = useMapEvent(
    'moveend', () => {
      const b = map.getBounds();
      setBounds({
        east: b.getEast(), west: b.getWest(), north: b.getNorth(), south: b.getSouth(),
      });
    },
  );

  useEffect(() => {
    (async () => {
      if (!bounds || map.getZoom() < 10) {
        setCampsites([]);
      }
      else {
        const response = await Http.get(`/api/campsites?n=${bounds.north}&s=${bounds.south}&e=${bounds.east}&w=${bounds.west}`);

        if (response.ok) {
          const body = await response.body();
          if (isCampsiteResponse(body)) {
            setCampsites(body);
          }
        }
      }
    })();
  }, [bounds, map]);

  return (
    <>
      {
        campsites.map((c) => (
          <LeafletMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon('/campsite.svg')}
          />
        ))
      }
    </>
  );
};

export default Campsites;
