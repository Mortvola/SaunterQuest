import React from 'react';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';
import Grade from './Grade';
import { RouteInterface } from '../state/Types';
import { useMap } from 'react-leaflet';

type PropsType = {
  route: RouteInterface;
}

const Route: React.FC<PropsType> = observer(({
  route,
}) => {
  const leafletMap = useMap();
  const [initialized, setInitialized] = React.useState<RouteInterface | null>(null);

  React.useEffect(() => {
    if (route && initialized !== route) {
      if (route.bounds) {
        try {
          leafletMap.fitBounds(route.bounds);
          const z = leafletMap.getZoom();
          if (z > 13) {
            leafletMap.setZoom(13);
          }
          setInitialized(route);
          leafletMap.fireEvent('moveend');
        }
        catch (error) {
          console.log(error);
        }  
      }
    }
  }, [route, route.bounds, initialized, leafletMap]);

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
        <Grade route={route} />
      </>
    );
  }

  return null;
});

export default Route;
