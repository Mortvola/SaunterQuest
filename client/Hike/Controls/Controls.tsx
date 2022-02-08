import React, { ReactElement, useState } from 'react';
import { Button } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { HikeInterface } from '../../state/Types';
import Schedule from './Schedule';
import HikerProfiles from './HikerProfiles';
import Equipment from './Equipment';
import TodoList from './TodoList';
import Waypoints from './Waypoints';
import TrailConditions from '../TrailConditions';
import styles from './Controls.module.css';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';

type PropsType = {
  hike: HikeInterface,
}

const Controls = observer(({
  hike,
}: PropsType): ReactElement => {
  const [selection, setSelection] = useState<string>('schedule');
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this leg?',
    () => {
      if (hike.currentLeg === null) {
        throw new Error('currentLeg is null');
      }

      hike.deleteLeg(hike.currentLeg);
    },
  );

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelection(event.target.value);
  };

  const handleAddLegClick: React.MouseEventHandler = () => {
    hike.addLeg();
  };

  const handleLegChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    hike.setCurrentLeg(parseInt(event.target.value, 10));
  };

  return (
    <div className={styles.controlsGridItem}>
      <div>
        <select value={hike.currentLeg?.id} onChange={handleLegChange}>
          {
            hike.hikeLegs.map((hl) => (
              <option key={hl.id} value={hl.id}>{hl.id}</option>
            ))
          }
        </select>
        <Button onClick={handleAddLegClick}>Add Leg</Button>
        <IconButton icon="trash" onClick={handleDeleteClick} />
        <DeleteConfirmation />
      </div>
      <div className={styles.legControls}>
        <select onChange={handleSelectChange}>
          <option value="schedule">Schedule</option>
          <option value="hikerProfiles">Hiking Profiles</option>
          <option value="photos">Photos</option>
          <option value="trailConditions">Trail Conditions</option>
          <option value="equipment">Gear</option>
          <option value="resupply">Resupply</option>
          <option value="todoList">To-do</option>
          <option value="notes">Notes</option>
          <option value="waypoints">Route</option>
        </select>
        {
          (() => {
            switch (selection) {
              case 'schedule':
                return (
                  hike.currentLeg
                    ? <Schedule hikeLeg={hike.currentLeg} />
                    : null
                );

              case 'trailConditions':
                return <TrailConditions />;

              case 'hikerProfiles':
                return (
                  hike.currentLeg
                    ? <HikerProfiles hikeLeg={hike.currentLeg} />
                    : null
                );

              case 'equipment':
                return (
                  <Equipment />
                );

              case 'resupply':
                return <div />;

              case 'todoList':
                return (
                  <TodoList />
                );

              case 'notes':
                return <div />;

              case 'waypoints':
                return (
                  <Waypoints />
                );

              default:
                return <div />;
            }
          })()
        }
      </div>
    </div>
  );
});

export default Controls;
