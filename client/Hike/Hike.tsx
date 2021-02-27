import React, {
  useState, useEffect, useContext, ReactElement,
} from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import ElevationChart from './Elevation/ElevationChart';
import Controls from './Controls';
import MobxStore from '../state/store';
import MapContainer from './MapContainer';
import EditableText from '../Hikes/EditableText';

type Props = {
  tileServerUrl: string;
}

const Hike = ({
  tileServerUrl,
}: Props): ReactElement | null => {
  const { uiState } = useContext(MobxStore);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (uiState.hike && !initialized) {
      setInitialized(true);
      uiState.hike.route.requestRoute();
    }
  }, [initialized, uiState.hike]);

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

Hike.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
};

export default observer(Hike);
