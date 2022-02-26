import L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { Marker as LeafletMarker } from 'react-leaflet';
import { HikeInterface, PointOfInterestInterface } from '../../state/Types';

type PropsType = {
  hike: HikeInterface,
  marker: PointOfInterestInterface,
  icon: L.DivIcon,
  title?: string | null,
}

export class Poi extends L.Marker {
  data: PointOfInterestInterface | null = null;
}

const PoiMarker: React.FC<PropsType> = ({
  hike,
  marker,
  icon,
  title,
}) => {
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
          if (!hike) {
            throw new Error('hike is null');
          }

          if (hike.currentLeg === null) {
            throw new Error('currentLeg is null');
          }

          hike.currentLeg.map.clearSelectedMarkers();
          marker.setSelected(true);
          L.DomEvent.stop(event);
        },
      }}
    />
  );
};

export default PoiMarker;
