import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Polyline, useMap } from 'react-leaflet';
import Waypoint from './Waypoint';

const AnchorAndTrail = ({
  hikeId,
  anchor,
  dispatch,
}) => {
  const routeStrokeWeight = 6;

  return (
    <>
      {
        anchor.type !== null && anchor.type !== undefined
          ? <Waypoint hikeId={hikeId} waypoint={anchor} dispatch={dispatch} />
          : null
      }
      {
        anchor.trail
          ? (
            <Polyline
              positions={anchor.trail}
              pathOptions={{
                color: '#0000FF',
                opacity: 1.0,
                weight: routeStrokeWeight,
                zIndex: 20,
              }}
            />
          )
          : null
      }
    </>
  );
};

AnchorAndTrail.propTypes = {
  hikeId: PropTypes.number.isRequired,
  anchor: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

const Route = ({
  hikeId,
  route,
  bounds,
  dispatch,
}) => {
  const map = useMap();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (bounds && !initialized) {
      try {
        map.fitBounds(bounds);
        const z = map.getZoom();
        if (z > 13) {
          map.setZoom(13);
        }
        setInitialized(true);
      }
      catch (error) {
        console.log(error);
      }
    }
  }, [bounds, initialized]);

  if (route) {
    return (
      <>
        {
          route.map((a) => (
            <AnchorAndTrail
              key={a.id}
              hikeId={hikeId}
              anchor={a}
              dispatch={dispatch}
            />
          ))
        }
      </>
    );
  }

  return null;
};

Route.propTypes = {
  hikeId: PropTypes.number.isRequired,
  route: PropTypes.arrayOf(PropTypes.shape()),
  bounds: PropTypes.shape(),
  dispatch: PropTypes.func.isRequired,
};

Route.defaultProps = {
  route: null,
  bounds: null,
};

export default Route;
