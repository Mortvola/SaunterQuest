import React, {
  useEffect, ReactElement,
} from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { matchPath, useHistory } from 'react-router-dom';
import ElevationChart from './Elevation/ElevationChart';
import Controls from './Controls';
import { useStores } from '../state/store';
import MapContainer from './MapContainer';
import EditableText from '../Hikes/EditableText';
import HikeData from '../state/Hike';
import UploadFileButton from './UploadFileButton';

type Props = {
  tileServerUrl: string;
  extendedMenu: unknown;
}

const Hike = ({
  tileServerUrl,
  extendedMenu,
}: Props): ReactElement | null => {
  const { uiState, gpx } = useStores();
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

  const handleDayMarkerToggle = () => {
    runInAction(() => {
      uiState.showMarkers.set('day', !uiState.showMarkers.get('day'));
    });
  };

  const handleWaypointToggle = () => {
    runInAction(() => {
      uiState.showMarkers.set('waypoint', !uiState.showMarkers.get('waypoint'));
    });
  };

  const handleWaterToggle = () => {
    runInAction(() => {
      uiState.showMarkers.set('water', !uiState.showMarkers.get('water'));
    });
  };

  const handleCampsiteToggle = () => {
    runInAction(() => {
      uiState.showMarkers.set('campsite', !uiState.showMarkers.get('campsite'));
    });
  };

  const handleResupplyToggle = () => {
    runInAction(() => {
      uiState.showMarkers.set('resupply', !uiState.showMarkers.get('resupply'));
    });
  };

  let locationPopup = null;
  if (uiState.hike && uiState.hike.map) {
    locationPopup = uiState.hike.map.locationPopup;
  }

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files.length > 0) {
      gpx.loadGpxData(files[0]);
    }
  };

  if (uiState.hike) {
    return (
      <div className="hike-grid">
        <Controls hike={uiState.hike} />
        <div className="name-grid-item">
          <EditableText
            defaultValue={uiState.hike.name}
            url={uiState.hike.id.toString()}
            prop="name"
          />
          <UploadFileButton onFileSelection={handleFileSelection} label="Upload GPX" accept="*.gpx" />
          <div className="blog-controls">
            <input
              type="image"
              onClick={handleDayMarkerToggle}
              style={{ padding: '3px 3px' }}
              src="/moon.svg"
              alt="moon"
            />
            <input
              type="image"
              onClick={handleWaypointToggle}
              style={{ padding: '3px 3px' }}
              src="/compass.svg"
              alt="waypoint"
            />
            <input
              type="image"
              onClick={handleWaterToggle}
              style={{ padding: '3px 3px' }}
              src="/water.svg"
              alt="water"
            />
            <input
              type="image"
              onClick={handleCampsiteToggle}
              style={{ padding: '3px 3px' }}
              src="/campsite.svg"
              alt="campsite"
            />
            <input
              type="image"
              onClick={handleResupplyToggle}
              style={{ padding: '3px 3px' }}
              src="/resupply.svg"
              alt="resupply"
            />
          </div>
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
