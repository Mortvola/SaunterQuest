import React, {
  ReactElement, useEffect, useState,
} from 'react';
import 'leaflet.markercluster';
import { markerClusterGroup } from 'leaflet';
import Http from '@mortvola/http';
import { useMapEvent } from 'react-leaflet';
import {
  createPathComponent, LeafletContextInterface,
} from '@react-leaflet/core';
import { Campsite, isCampsiteResponse } from '../ResponseTypes';
import { createIcon } from './mapUtils';
import ClusterableMarker from './ClusterableMarker';

const createCluster = (props: unknown, context: LeafletContextInterface) => {
  const instance = markerClusterGroup();
  return { instance, context: { ...context, layerContainer: instance } };
};

const MarkerCluster = createPathComponent(createCluster);

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
      if (!bounds || map.getZoom() < 9) {
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
    <MarkerCluster>
      {
        campsites.map((c) => (
          <ClusterableMarker
            key={c.id}
            position={{ lat: c.location[1], lng: c.location[0] }}
            icon={createIcon('/campsite.svg', c.name)}
          />
        ))
      }
    </MarkerCluster>
  );
};

export default Campsites;
