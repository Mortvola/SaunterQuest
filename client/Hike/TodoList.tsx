import React, { ReactElement } from 'react';

const TodoList = (): ReactElement => (
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
);

export default TodoList;
