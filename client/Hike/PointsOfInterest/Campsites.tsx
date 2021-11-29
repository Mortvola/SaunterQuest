import React, {
  useEffect, useState,
} from 'react';
import 'leaflet.markercluster';
import {
  DomEvent, LatLng, LatLngBounds, LeafletEvent,
} from 'leaflet';
import Http from '@mortvola/http';
import { useMap, useMapEvent, Marker as LeafletMarker } from 'react-leaflet';
import { Campsite, isCampsiteResponse } from '../../../common/ResponseTypes';
import { createIcon } from '../mapUtils';
import { campsite } from '../Map/Icons';
import { useStores } from '../../state/store';
import Marker from '../../state/Marker';

type PropsType = {
  show: boolean,
}

const Campsites: React.FC<PropsType> = ({ show }) => {
  const { uiState } = useStores();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const leafletMap = useMap();

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

    if (leafletMap.getZoom() < 8 || !show) {
      setCampsites([]);
    }
    else if (bounds !== null) {
      queryCampsites(leafletMap, bounds);
    }
  }, [bounds, leafletMap, show]);

  useMapEvent('moveend', () => {
    const newBounds = leafletMap.getBounds();
    if (bounds === null || !bounds.contains(newBounds)) {
      setBounds(newBounds);
    }
  });

  useEffect(() => {
    setBounds(leafletMap.getBounds());
  }, [leafletMap]);

  return (
    <>
      {
        campsites.map((c) => (
          <LeafletMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon(campsite)}
            title={c.name}
            eventHandlers={{
              click: (event: LeafletEvent) => {
                if (!uiState.hike) {
                  throw new Error('hike is null');
                }

                uiState.setSelectedMarker(
                  new Marker('campsite', new LatLng(c.location[0], c.location[1]), false, false, uiState.hike.map),
                );
                DomEvent.stop(event);
              },
            }}
          />
        ))
      }
    </>
  );
};

export default Campsites;
