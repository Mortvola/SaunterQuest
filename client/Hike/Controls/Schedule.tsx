import React from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner } from 'react-bootstrap';
import { positionMapToBounds } from '../mapUtils';
import {
  metersToFeet, metersToMilesRounded, formatTime,
} from '../../utilities';
import { HikeLegInterface, Day } from '../state/Types';
import styles from './Schedule.module.css';
// import EndOfDayMarker from './trailMarker/EndOfDayMarker';

type PropsType = {
  hikeLeg: HikeLegInterface,
}

const Schedule: React.FC<PropsType> = observer(({
  hikeLeg,
}) => {
  const positionMapToDay = (d: number) => {
    //
    // Position the map so that the two endpoints (today's and tomorrow's) are visible.
    // todo: take into account the area the whole path uses. Some paths go out of window
    // even though the two endpoints are within the window.
    //
    if (hikeLeg.schedule && hikeLeg.map) {
      const leafletMap = hikeLeg.map.getLeafLetMap();
      if (leafletMap) {
        if (d < hikeLeg.schedule.length - 1) {
          positionMapToBounds(
            leafletMap, hikeLeg.schedule[d].latLng, hikeLeg.schedule[d + 1].latLng,
          );
        }
        else {
          positionMapToBounds(
            leafletMap,
            hikeLeg.schedule[d].latLng,
            hikeLeg.route.anchors[hikeLeg.route.anchors.length - 1].latLng,
          );
        }
      }
    }
  };

  const renderDay = (day: Day, dayNumber: number) => {
    const miles = metersToMilesRounded(day.startMeters + day.meters);

    return (
      <div key={dayNumber} className="day-card">
        <div
          className="card-header"
          style={{ padding: '5px 5px 5px 5px' }}
          onClick={() => positionMapToDay(dayNumber)}
          role="button"
          onKeyPress={() => positionMapToDay(dayNumber)}
          tabIndex={0}
        >
          <div className="day-card-header">
            <div>{`Day ${dayNumber + 1}`}</div>
            <div />
            <div>{`${metersToMilesRounded(day.meters)} miles`}</div>
          </div>
        </div>
        <div className="day-card-body">
          <div>{`Start: ${formatTime(day.startTime)}, mile ${metersToMilesRounded(day.startMeters)}`}</div>
          <div>{`Stop: ${formatTime(day.endTime)}, mile ${miles}`}</div>
          <div>{`Gain/Loss: ${metersToFeet(day.gain)}/${metersToFeet(day.loss)} feet`}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.schedule} ${hikeLeg.requestingSchedule ? styles.waiting : ''}`}>
      {
        hikeLeg.requestingSchedule
          ? (
            <Spinner animation="border" size="sm" />
          )
          : hikeLeg.schedule.map((day, index) => renderDay(day, index))
      }
    </div>
  );
});

export default Schedule;
