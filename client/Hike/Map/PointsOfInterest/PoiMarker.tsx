import L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { Marker as LeafletMarker } from 'react-leaflet';
import { useStores } from '../../../state/store';
import { MarkerInterface, PointOfInterestInterface } from '../../../state/Types';

type PropsType = {
  marker: PointOfInterestInterface,
  icon: L.DivIcon,
  title?: string | null,
}

export class Poi extends L.Marker {
  data: PointOfInterestInterface | null = null;
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
      position={marker.marker.latLng}
      icon={icon}
      title={title ?? undefined}
      eventHandlers={{
        click: (event: L.LeafletEvent) => {
          if (!uiState.hike) {
            throw new Error('hike is null');
          }

          if (uiState.hike.currentLeg === null) {
            throw new Error('currentLeg is null');
          }

          uiState.hike.currentLeg.map.clearSelectedMarkers();
          marker.setSelected(true);
          L.DomEvent.stop(event);
        },
      }}
    />
  );
};

export default PoiMarker;
