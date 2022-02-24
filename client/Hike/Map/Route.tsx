import React from 'react';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';
import Grade from './Grade';
import { RouteInterface } from '../../state/Types';

type PropsType = {
  route: RouteInterface;
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
