import React, { ReactElement } from 'react';
// import PropTypes from 'prop-types';
import { Polyline } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import Waypoint from './Waypoint';
import Route from '../state/Route';
import Anchor from '../state/Anchor';

type Props = {
  route: Route;
  anchor: Anchor;
};

const AnchorAndTrail = ({
  route,
  anchor,
}: Props): ReactElement => {
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
              }}
            />
          )
          : null
      }
    </>
  );
};

// AnchorAndTrail.propTypes = {
//   route: PropTypes.shape(),
//   anchor: PropTypes.shape().isRequired,
// };

export default observer(AnchorAndTrail);
