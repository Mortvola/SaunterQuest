import React from 'react';
import { observer } from 'mobx-react-lite';
import Trail from './Trail';
import RouteData from '../state/Route';

type PropsType = {
  route: RouteData;
}

const Route = ({
  route,
}: PropsType) => {
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

export default observer(Route);
