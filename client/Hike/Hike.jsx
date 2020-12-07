import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import ElevationChart from './ElevationChart';
import Map from './Map';
import Controls from './Controls';
import MobxStore from '../state/store';

const Hike = ({
  tileServerUrl,
}) => {
  const { uiState } = useContext(MobxStore);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      uiState.hike.route.requestRoute();
    }
  }, []);

  let locationPopup = null;
  if (uiState.hike.map) {
    locationPopup = uiState.hike.map.locationPopup;
  }

  if (uiState.hike) {
    return (
      <div className="hike-grid">
        <Map
          tileServerUrl={tileServerUrl}
          hike={uiState.hike}
          map={uiState.hike.map}
          dayMarkers={uiState.hike.dayMarkers}
          locationPopup={locationPopup}
        />
        <ElevationChart elevations={uiState.hike.route.elevations} />
        <Controls hike={uiState.hike} />
      </div>
    );
  }

  return null;
};

Hike.propTypes = {
  tileServerUrl: PropTypes.string.isRequired,
};

export default observer(Hike);
