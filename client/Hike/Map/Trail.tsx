import React, { ReactElement } from 'react';
import { Polyline } from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import { TrailPoint } from '../../state/Types';

type Props = {
  trail: TrailPoint[];
};

const Trail: React.FC<Props> = ({ trail }): ReactElement | null => {
  const routeStrokeWeight = 6;

  if (trail && trail.length > 0) {
    return (
      <Polyline
        positions={trail}
        pathOptions={{
          color: '#0000FF',
          opacity: 1.0,
          weight: routeStrokeWeight,
        }}
      />
    );
  }

  return null;
};

export default observer(Trail);
