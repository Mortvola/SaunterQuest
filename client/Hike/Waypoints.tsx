import React, { ReactElement } from 'react';

const Waypoints = (): ReactElement => (
  <div>
    <div>Waypoints:</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="waypoint-table-header">
        <div className="waypoint-table-header-cell" style={{ width: '15%' }}>Label</div>
        <div className="waypoint-table-header-cell">Name</div>
      </div>
      <div id="sortable" />
    </div>
  </div>
);

export default Waypoints;
