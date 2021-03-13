import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';

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

Route.propTypes = {
  route: PropTypes.shape().isRequired,
};

export default observer(Route);
