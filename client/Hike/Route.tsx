import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';
import RouteData from '../state/Route';

type PropsType = {
  route: RouteData;
}

const Route = ({
  route,
}: PropsType) => {
  const leafletMap = useMap();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (route.bounds
      && !initialized
    ) {
      try {
        leafletMap.fitBounds(route.bounds);
        const z = leafletMap.getZoom();
        if (z > 13) {
          leafletMap.setZoom(13);
        }
        setInitialized(true);
      }
      catch (error) {
        console.log(error);
      }
    }
  }, [route.bounds, initialized, leafletMap]);

  if (route.anchors) {
    return (
      <>
        {
          route.anchors.map((a) => (
            <Trail
              key={a.id}
              trail={a.trail}
            />
          ))
        }
      </>
    );
  }

  return null;
};

export default observer(Route);
