import React, { ReactElement } from 'react';
import { loadResupply } from './resupplyPlan';
import { addTrailCondition } from './trailCondition';
import Schedule from './Schedule';
import HikerProfiles from './HikerProfiles';
import { HikeInterface } from 'state/Types';

type PropsType = {
  hike: HikeInterface,
}

const Controls = ({
  hike,
}: PropsType): ReactElement => {
  const handleResupplyClick = () => {
    loadResupply(hike.id);
  };

  return (
    <div className="controls-grid-item">
      <ul className="nav nav-tabs" role="tablist">
        <li className="nav-item"><a className="nav-link active" data-toggle="tab" href="#schedule">Schedule</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#trailConditions">Trail Conditions</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#hikerProfiles">Hiker Profiles</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#equipment">Gear</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#resupply" onClick={handleResupplyClick}>Resupply</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#todoList">To-do</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#notes">Notes</a></li>
        <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#waypoints">Route</a></li>
      </ul>
      <div className="tab-content">
        <div id="schedule" className="tab-pane fade show active">
          <Schedule hike={hike} />
        </div>
        <div id="hikerProfiles" className="tab-pane fade">
          <HikerProfiles hike={hike} />
        </div>
        <div id="equipment" className="tab-pane fade">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Type</th>
                <th>Brand & Model</th>
                <th>Max Distance</th>
                <th>Current Distance</th>
              </tr>
            </thead>
            <tbody>
              <tr id="gearLastRow">
                <td>
                  <button type="button" className="btn btn-sm">
                    <i className="fas fa-plus" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="resupply" className="tab-pane fade" />
        <div id="trailConditions" className="tab-pane fade">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Pace Factor</th>
              </tr>
            </thead>
            <tbody>
              <tr id="conditionsLastRow">
                <td>
                  <button type="button" className="btn btn-sm" onClick={addTrailCondition}>
                    <i className="fas fa-plus" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="todoList" className="tab-pane fade">
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Task</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              <tr id="todoLastRow">
                <td>
                  <button type="button" className="btn btn-sm">
                    <i className="fas fa-plus" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="notes" className="tab-pane fade" />

        <div id="waypoints" className="tab-pane fade">
          <div>Waypoints:</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="waypoint-table-header">
              <div className="waypoint-table-header-cell" style={{ width: '15%' }}>Label</div>
              <div className="waypoint-table-header-cell">Name</div>
            </div>
            <div id="sortable" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
