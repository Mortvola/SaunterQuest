import React, {
  useEffect, ReactElement,
} from 'react';
import { observer } from 'mobx-react-lite';
import { matchPath, useHistory } from 'react-router-dom';
import Http from '@mortvola/http';
import { Offcanvas } from 'react-bootstrap';
import Controls from './Controls/Controls';
import { useStores } from './state/store';
import MapContainer from './Map/MapContainer';
import HikeData from './state/Hike';
import styles from './Hike.module.css';
import useMediaQuery from '../MediaQuery';
import Terrain from './Terrain/Terrain';
import { HikeProps } from '../../common/ResponseTypes';

type Props = {
  tileServerUrl: string,
  showOffcanvas: boolean,
  onHideOffcanvas: () => void,
}

const Hike = ({
  tileServerUrl,
  showOffcanvas,
  onHideOffcanvas,
}: Props): ReactElement | null => {
  const { uiState } = useStores();
  const [hike, setHike] = React.useState<HikeData | null>(null);
  const history = useHistory();
  const { isMobile, addMediaClass } = useMediaQuery();

  useEffect(() => {
    (async () => {
      if (hike === null) {
        const match = matchPath<{ id: string }>(history.location.pathname, { path: '/hike/:id', exact: true });
        if (match) {
          const response = await Http.get<HikeProps>(`/api/hike/${parseInt(match.params.id, 10)}`);

          if (response.ok) {
            const body = await response.body();

            setHike(new HikeData(body));
          }
        }
      }
    })();
  }, [hike, history.location.pathname, uiState]);

  let locationPopup = null;
  if (hike && hike.currentLeg && hike.currentLeg.map) {
    locationPopup = hike.currentLeg.map.locationPopup;
  }

  if (hike) {
    const handleClose = () => {
      uiState.showIn3D(null);
    };

    return (
      <>
        <div className={addMediaClass(styles.hikeGrid)}>
          {
            !isMobile
              ? (
                <Controls hike={hike} />
              )
              : (
                <Offcanvas show={showOffcanvas} onHide={onHideOffcanvas}>
                  <Offcanvas.Header closeButton />
                  <Offcanvas.Body>
                    <Controls hike={hike} />
                  </Offcanvas.Body>
                </Offcanvas>
              )
          }
          <MapContainer
            tileServerUrl={tileServerUrl}
            hike={hike}
            locationPopup={locationPopup}
          />
        </div>
        {
          uiState.location3d
            ? (
              <Terrain
                photoUrl={`/api/hike/${hike.id}/photo`}
                photo={uiState.photo}
                editPhoto={uiState.editPhoto}
                tileServerUrl={tileServerUrl}
                position={uiState.location3d}
                onClose={handleClose}
              />
            )
            : null
        }
      </>
    );
  }

  return null;
};

export default observer(Hike);
