import React, { useContext } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { metersToMilesRounded } from '../utilities';
import EditableText from './EditableText';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { VIEW_HIKE } from '../menuEvents';
import MobxStore from '../state/store';
import HikeItem from '../state/HikeItem';
import HikeData from '../state/Hike';

type PropsType = {
  hike: HikeItem;
  onDelete: (id: number) => void;
}

const Hike = ({
  hike,
  onDelete,
}: PropsType) => {
  const { uiState } = useContext(MobxStore);
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this hike?',
    () => {
      onDelete(hike.id);
    },
  );

  const handleOpen = () => {
    uiState.setView(VIEW_HIKE);
    uiState.setHike(new HikeData(hike));
  };

  return (
    <div
      className="card bpp-shadow mr-4 mb-4 flex-shrink-0 flex-grow-0"
      style={{ width: '250px' }}
    >
      <div className="hike-card-header card-header">
        <EditableText
          defaultValue={hike.name}
          url={`hike/${hike.id}`}
          prop="name"
        />
      </div>
      <div className="card-body">
        <div />
        <div>
          Distance:
          {
            hike.requesting
              ? <Spinner animation="border" size="sm" role="status" className="hike-detail-spinner" />
              : <span className="hike-detail">{`${metersToMilesRounded(hike.distance)} miles`}</span>
          }
        </div>
        <div>
          Duration:
          {
            hike.requesting
              ? <Spinner animation="border" size="sm" role="status" className="hike-detail-spinner" />
              : <span className="hike-detail">{`${hike.duration} days`}</span>
          }
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
          <Button
            variant="light"
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
          <Button onClick={handleOpen}>
            Open
          </Button>
        </div>
      </div>
      <DeleteConfirmation />
    </div>
  );
};

export default observer(Hike);
