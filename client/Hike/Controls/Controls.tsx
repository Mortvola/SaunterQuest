import React, { ReactElement, useState } from 'react';
import { Button } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { HikeInterface } from '../state/Types';
import Schedule from './Schedule';
import HikerProfiles from './HikerProfiles';
import Equipment from './Equipment';
import TodoList from './TodoList';
import Waypoints from './Waypoints';
import TrailConditions from '../TrailConditions';
import styles from './Controls.module.css';
import IconButton from '../../IconButton';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import HikeLegs from './HikeLegs';

type PropsType = {
  hike: HikeInterface,
  style?: React.CSSProperties,
}

const Controls = observer(({
  hike,
  style,
}: PropsType): ReactElement => {
  const [selection, setSelection] = useState<string>('schedule');

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelection(event.target.value);
  };

  return (
    <div className={styles.controlsGridItem} style={style}>
      <HikeLegs hike={hike} />
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
