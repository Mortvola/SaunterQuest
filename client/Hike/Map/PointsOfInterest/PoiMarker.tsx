import L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { Marker as LeafletMarker } from 'react-leaflet';
import { useStores } from '../../../state/store';
import { MarkerInterface } from '../../../state/Types';

type PropsType = {
  marker: MarkerInterface,
  icon: L.DivIcon,
  title?: string,
}

export class Poi extends L.Marker {
  data: MarkerInterface | null = null;
}

const PoiMarker: React.FC<PropsType> = ({
  marker,
  icon,
  title,
}) => {
  const { uiState } = useStores();
  const ref = useRef<L.Marker>(null);

  useEffect(() => {
    const m = ref.current;

    if (m) {
      (m as Poi).data = marker;
    }
  }, [marker]);

  return (
    <LeafletMarker
      ref={ref}
      position={marker.latLng}
      icon={icon}
      title={title}
      eventHandlers={{
        click: (event: L.LeafletEvent) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          marker.toggleSelection();
          L.DomEvent.stop(event);
        },
      }}
    />
  );
};

export default PoiMarker;
