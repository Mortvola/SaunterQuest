import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Http from '@mortvola/http';
import { Offcanvas } from 'react-bootstrap';
import Controls from './Controls/Controls';
import { useStores } from './state/store';
import MapContainer from './Map/MapContainer';
import HikeData from './state/Hike';
import styles from './Hike.module.css';
import useMediaQuery from '../MediaQuery';
import Terrain from '../Terrain/Terrain';
import { HikeProps } from '../../common/ResponseTypes';
import Calendar from './Calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import IconButton from '../IconButton';

type PropsType = {
  tileServerUrl: string,
  showOffcanvas: boolean,
  onHideOffcanvas: () => void,
}

const Hike: React.FC<PropsType> = observer(({
  tileServerUrl,
  showOffcanvas,
  onHideOffcanvas,
}) => {
  const { uiState } = useStores();
  const [hike, setHike] = React.useState<HikeData | null>(null);
  const params = useParams();
  const { isMobile, addMediaClass } = useMediaQuery();
  const [view, setView] = React.useState<'map' | 'calendar'>('map');

  useEffect(() => {
    (async () => {
      if (hike === null) {
        if (params.hikeId !== undefined) {
          const response = await Http.get<HikeProps>(`/api/hike/${parseInt(params.hikeId, 10)}`);

          if (response.ok) {
            const body = await response.body();

            setHike(new HikeData(body));
          }
        }
      }
    })();
  }, [hike, params.hikeId]);

  const handleCalendarToggle = () => {
    setView((prev) => (prev === 'map' ? 'calendar' : 'map'));
  };

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
                <Controls hike={hike} style={{ gridArea: 'controls' }} />
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
          <div className={styles.titleBar}>
            <div className={styles.title}>{hike.name}</div>
            {
              view === 'map'
                ? <IconButton icon="calendar" onClick={handleCalendarToggle} />
                : <IconButton icon="map" onClick={handleCalendarToggle} />
            }
          </div>
          {
            view === 'map'
              ? (
                <MapContainer
                  tileServerUrl={tileServerUrl}
                  hike={hike}
                  locationPopup={locationPopup}
                  style={{ gridArea: 'map' }}
                />
              )
              : (
                <Calendar hike={hike} style={{ gridArea: 'map' }} />
              )
          }
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
});

export default Hike;
