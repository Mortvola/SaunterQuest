import React, {
  useEffect, useContext, ReactElement,
} from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { matchPath, useHistory } from 'react-router-dom';
import ElevationChart from './Elevation/ElevationChart';
import Controls from './Controls';
import MobxStore from '../state/store';
import MapContainer from './MapContainer';
import EditableText from '../Hikes/EditableText';
import HikeData from '../state/Hike';

type Props = {
  tileServerUrl: string;
}

const Hike = ({
  tileServerUrl,
}: Props): ReactElement | null => {
  const { uiState } = useContext(MobxStore);
  const history = useHistory();

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
      <div className="hike-grid">
        <Controls hike={uiState.hike} />
        <div className="name-grid-item">
          <EditableText
            defaultValue={uiState.hike.name}
            url={`hike/${uiState.hike.id}`}
            prop="name"
          />
        </div>
        <MapContainer
          tileServerUrl={tileServerUrl}
          hike={uiState.hike}
          locationPopup={locationPopup}
        />
        <ElevationChart hike={uiState.hike} />
      </div>
    );
  }

  return null;
};

export default observer(Hike);
