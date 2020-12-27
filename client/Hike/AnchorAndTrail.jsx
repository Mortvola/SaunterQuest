import React from 'react';
import PropTypes from 'prop-types';
import { Polyline } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Waypoint from './Waypoint';

const AnchorAndTrail = observer(({
  route,
  anchor,
}) => {
  const routeStrokeWeight = 6;

  return (
    <>
      {
        anchor.type !== null && anchor.type !== undefined
          ? <Waypoint route={route} waypoint={anchor} />
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
});

AnchorAndTrail.propTypes = {
  route: PropTypes.shape(),
  anchor: PropTypes.shape().isRequired,
};

export default AnchorAndTrail;
