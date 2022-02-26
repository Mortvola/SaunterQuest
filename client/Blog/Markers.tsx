import React from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import Marker from '../Hike/Map/Marker';
import { HikeLegInterface } from '../Hike/state/Types';

type PropsType = {
  hikeLeg: HikeLegInterface,
}

const Markers: React.FC<PropsType> = ({ hikeLeg }) => {
  const map = useMap();
  const [renderMarkers, setRenderMarkers] = React.useState<boolean>(map.getZoom() > 8);

  useMapEvent('zoomend', () => {
    setRenderMarkers(map.getZoom() > 8);
  });

  if (renderMarkers) {
    return (
      <>
        {
          hikeLeg.map.markers.map((m) => (
            <Marker
              key={`${m.getTypeString()}-${m.id}`}
              marker={m}
              hikeLeg={hikeLeg}
              draggingLocked
              selections={{ day: true }}
            />
          ))
        }
      </>
    );
  }

  return null;
};

export default Markers;
