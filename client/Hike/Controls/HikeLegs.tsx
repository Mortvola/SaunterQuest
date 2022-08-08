import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button } from 'react-bootstrap';
import { useConfirmation } from '../../Confirmation';
import IconButton from '../../IconButton';
import { HikeInterface } from '../state/Types';
import { useHikeLegDialog } from './HikeLegDialog';
import styles from './HikeLegs.module.css';
import HikeLegSelect, { OptionValue } from './HikeLegSelect';

type PropsType = {
  hike: HikeInterface,
}

const HikeLegs: React.FC<PropsType> = observer(({ hike }) => {
  const [HikeLegDialog, showHikeLegDialog] = useHikeLegDialog();
  const [DeleteConfirmation, handleDeleteClick] = useConfirmation(
    'Delete',
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

  const handleLegChange = (id: number | null) => {
    hike.setCurrentLeg(id);
  };

  return (
    <div>
      <Button onClick={handleAddLegClick}>Add Leg</Button>
      <div className={styles.leg}>
        <HikeLegSelect hike={hike} value={hike.currentLeg?.id} onChange={handleLegChange} />
        <IconButton icon="pencil" onClick={handleEditClick} />
        <IconButton icon="trash" onClick={handleDeleteClick} />
      </div>
      {
        hike.currentLeg
          ? <HikeLegDialog hike={hike} hikeLeg={hike.currentLeg} />
          : null
      }
      <DeleteConfirmation />
    </div>
  );
});

export default HikeLegs;
