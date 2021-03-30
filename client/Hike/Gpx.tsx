import React from 'react';
import { observer } from 'mobx-react-lite';
import { Polyline } from 'react-leaflet';
import { useStores } from '../state/store';

const Gpx = () => {
  const { gpx } = useStores();

  return (
    <>
      {
        gpx.tracks.length > 0
          ? (
            <Polyline
              positions={gpx.tracks}
            />
          )
          : null
      }
    </>
  );
};

export default observer(Gpx);
