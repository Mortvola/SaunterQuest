import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import AnchorAndTrail from './AnchorAndTrail';

const Route = ({
  route,
}) => {
  const leafletMap = useMap();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (route.bounds
      && route.bounds[0] !== undefined
      && route.bounds[1] !== undefined
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
  }, [route.bounds, initialized]);

  if (route.anchors) {
    return (
      <>
        {
          route.anchors.map((a) => (
            <AnchorAndTrail
              key={a.id}
              route={route}
              anchor={a}
            />
          ))
        }
      </>
    );
  }

  return null;
};

Route.propTypes = {
  route: PropTypes.shape().isRequired,
};

export default observer(Route);
