import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button } from 'react-bootstrap';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import IconButton from '../../IconButton';
import { HikeInterface } from '../state/Types';
import { useHikeLegDialog } from './HikeLegDialog';
import styles from './HikeLegs.module.css';

type PropsType = {
  hike: HikeInterface,
}

const HikeLegs: React.FC<PropsType> = observer(({ hike }) => {
  const [HikeLegDialog, showHikeLegDialog] = useHikeLegDialog();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this leg?',
    () => {
      if (hike.currentLeg === null) {
        throw new Error('currentLeg is null');
      }

      hike.deleteLeg(hike.currentLeg);
    },
  );
  
  const handleAddLegClick: React.MouseEventHandler = () => {
    hike.addLeg();
  };

  const handleEditClick = () => {
    showHikeLegDialog();
  };

  const handleLegChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    hike.setCurrentLeg(parseInt(event.target.value, 10));
  };

  return (
    <div>
      <Button onClick={handleAddLegClick}>Add Leg</Button>
      <div className={styles.leg}>
        <select value={hike.currentLeg?.id} onChange={handleLegChange}>
          {
            hike.hikeLegs.map((hl) => (
              <option key={hl.id} value={hl.id}>{hl.name ?? hl.id}</option>
            ))
          }
        </select>
        <IconButton icon="pencil" onClick={handleEditClick} />
        <IconButton icon="trash" onClick={handleDeleteClick} />
      </div>
      {
        hike.currentLeg
          ? <HikeLegDialog hikeLeg={hike.currentLeg} />
          : null
      }
      <DeleteConfirmation />
    </div>
  );
});

export default HikeLegs;
