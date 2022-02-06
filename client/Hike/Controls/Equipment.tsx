import React, { ReactElement } from 'react';

const Equipment = (): ReactElement => (
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
);

export default Equipment;
