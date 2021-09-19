import React, { ReactElement } from 'react';
import { addTrailCondition } from './trailCondition';

const TrailConditions = (): ReactElement => (
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
);

export default TrailConditions;
