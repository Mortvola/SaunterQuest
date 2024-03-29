import React, { ReactElement, useState } from 'react';
import { HikeInterface } from '../state/Types';
import Schedule from './Schedule';
import HikerProfiles from './HikerProfiles';
import Equipment from './Equipment';
import TodoList from './TodoList';
import Waypoints from './Waypoints';
import TrailConditions from './TrailConditions';
import styles from './Controls.module.css';

type PropsType = {
  hike: HikeInterface,
}

const Controls = ({
  hike,
}: PropsType): ReactElement => {
  // const handleResupplyClick = () => {
  //   loadResupply(hike.id);
  // };
  const [selection, setSelection] = useState<string>('schedule');

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelection(event.target.value);
  };

  return (
    <div className={styles.controlsGridItem}>
      <select className="form-control" onChange={handleSelectChange}>
        <option value="schedule">Schedule</option>
        <option value="trailConditions">Trail Conditions</option>
        <option value="hikerProfiles">Hiker Profiles</option>
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
                  <Schedule hike={hike} />
                );

              case 'trailConditions':
                return <TrailConditions />;

              case 'hikerProfiles':
                return (
                  <HikerProfiles hike={hike} />
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
  );
};

export default Controls;
