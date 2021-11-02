import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory } from 'react-router-dom';
import Hike from './Hike';
import PleaseWait from './PleaseWait';
import { useStores } from '../state/store';
import HikeData from '../state/Hike';

const Hikes = () => {
  const { uiState, hikeManager } = useStores();
  const history = useHistory();

  const handleDelete = (id: number) => {
    hikeManager.deleteHike(id);
  };

  const handleAddHike = async () => {
    const hike = await hikeManager.addHike();

    uiState.setHike(new HikeData(hike));
    history.push(`/hike/${hike.id}`);
  };

  return (
    <div className="hikes-wrapper">
      <h4>
        Hikes
        <button type="button" className="btn btn-sm" onClick={handleAddHike}>
          <i className="fas fa-plus" />
        </button>
      </h4>
      <div className="hikes">
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
};

export default observer(Hikes);
