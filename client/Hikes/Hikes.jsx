import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import Hike from './Hike';
import PleaseWait from './PleaseWait';
import MobxStore from '../state/store';
import { VIEW_HIKE } from '../menuEvents';

const Hikes = () => {
  const { uiState, hikeManager } = useContext(MobxStore);

  const handleDelete = (id) => {
    hikeManager.deleteHike(id);
  };

  const handleAddHike = async () => {
    const hike = await hikeManager.addHike();

    uiState.hike = hike;
    uiState.setView(VIEW_HIKE);
  };

  return (
    <>
      <div className="row no-gutters" style={{ height: '100%' }}>
        <div className="col-md-12" style={{ overflowY: 'scroll', height: '100%' }}>
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
      </div>
    </>
  );
};

export default observer(Hikes);
