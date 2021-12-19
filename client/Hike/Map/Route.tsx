import React from 'react';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';
import RouteData from '../../state/Route';
import Grade from './Grade';

type PropsType = {
  route: RouteData;
}

const Route: React.FC<PropsType> = observer(({
  route,
}) => {
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
