import React, {
  useEffect, ReactElement, useState,
} from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { matchPath, useHistory } from 'react-router-dom';
import Controls from './Controls';
import { useStores } from '../state/store';
import MapContainer from './Map/MapContainer';
import HikeData from '../state/Hike';
import Toolbar from './Toolbar';
import styles from './Hike.module.css';
import useMediaQuery from '../MediaQuery';

type Props = {
  tileServerUrl: string;
  pathFinderUrl: string;
  extendedMenu: unknown;
}

const Hike = ({
  tileServerUrl,
  pathFinderUrl,
  extendedMenu,
}: Props): ReactElement | null => {
  const { uiState } = useStores();
  const history = useHistory();
  const { isMobile, addMediaClass } = useMediaQuery();

  useEffect(() => {
    runInAction(() => {
      if (uiState.hike === null) {
        const match = matchPath<{ id: string }>(history.location.pathname, { path: '/hike/:id', exact: true });
        if (match) {
          uiState.hike = new HikeData({ id: parseInt(match.params.id, 10), name: 'test' });
        }
      }
    });

    return (() => {
      runInAction(() => {
        uiState.hike = null;
      });
    });
  }, [history.location.pathname, uiState]);

  let locationPopup = null;
  if (uiState.hike && uiState.hike.map) {
    locationPopup = uiState.hike.map.locationPopup;
  }

  if (uiState.hike) {
    return (
      <div className={addMediaClass(styles.hikeGrid)}>
        {
          !isMobile
            ? (
              <Controls hike={uiState.hike} />
            )
            : null
        }
        <Toolbar hike={uiState.hike} />
        <MapContainer
          tileServerUrl={tileServerUrl}
          pathFinderUrl={pathFinderUrl}
          hike={uiState.hike}
          locationPopup={locationPopup}
        />
      </div>
    );
  }

  return null;
};

export default observer(Hike);
