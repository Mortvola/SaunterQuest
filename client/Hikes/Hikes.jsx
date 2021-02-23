import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { useHikeDialog } from './HikeDialog';
import Hike from './Hike';
import PleaseWait from './PleaseWait';
import MobxStore from '../state/store';

const Hikes = () => {
  const { hikeManager } = useContext(MobxStore);
  const [HikeDialog, showHikeDialog] = useHikeDialog();

  const handleDelete = (id) => {
    hikeManager.deleteHike(id);
  };

  return (
    <>
      <div className="row no-gutters" style={{ height: '100%' }}>
        <div className="col-md-12" style={{ overflowY: 'scroll', height: '100%' }}>
          <h4>
            Hikes
            <button type="button" className="btn btn-sm" onClick={showHikeDialog}>
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
      <HikeDialog />
    </>
  );
};

export default observer(Hikes);
