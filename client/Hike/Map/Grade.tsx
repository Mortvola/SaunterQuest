import { observer } from 'mobx-react-lite';
import React from 'react';
import { Polyline } from 'react-leaflet';
import { RouteInterface } from '../state/Types';

type PropsType = {
  route: RouteInterface,
}

const Grade: React.FC<PropsType> = observer(({ route }) => {
  const colors = ['#f00', '#f70', '#ff0', '#7f0', '#0f0'];

  return (
    <>
      {
        route.grade.map((g, index) => (
          g.length > 1
            // eslint-disable-next-line react/no-array-index-key
            ? <Polyline key={index} positions={g} color={colors[index] ?? '#00f'} weight={12} />
            : null
        ))
      }
    </>
  );
});

export default Grade;
