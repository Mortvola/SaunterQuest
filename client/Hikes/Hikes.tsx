import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Hike from './Hike';
import PleaseWait from './PleaseWait';
import { useStores } from '../Planner/state/store';
import HikeData from '../Hike/state/Hike';
import styles from './Hikes.module.css';

const Hikes: React.FC = observer(() => {
  const { uiState, hikeManager } = useStores();
  const navigate = useNavigate();

  useEffect(() => {
    hikeManager.requestHikes();
  }, [hikeManager]);

  const handleDelete = (id: number) => {
    hikeManager.deleteHike(id);
  };

  const handleAddHike = async () => {
    const hike = await hikeManager.addHike();

    uiState.setHike(new HikeData(hike));
    navigate(`/hike/${hike.id}`);
  };

  return (
    <div className={styles.hikesWrapper}>
      <h4>
        Hikes
        <button type="button" className="btn btn-sm" onClick={handleAddHike}>
          <i className="fas fa-plus" />
        </button>
      </h4>
      <div className={styles.hikes}>
        {
          hikeManager.hikes.map((h) => (
            <Hike
              key={h.id}
              hike={h}
              onDelete={handleDelete}
            />
          ))
        }
      </div>
      <PleaseWait show={hikeManager.requesting} />
    </div>
  );
});

export default Hikes;
