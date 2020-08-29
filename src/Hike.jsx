import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import 'regenerator-runtime/runtime';
import store from './redux/store';
import Menubar from './Menubar';
import { loadResupply } from './resupplyPlan';
import { addHikerProfile } from './hikerProfile';
import { addTrailCondition } from './trailCondition';
import ElevationChart from './elevationChart';
import { mapInitialize } from './hike';

const Hike = () => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            mapInitialize();
        }
    });

    return (
        <div className="hike-grid">
            <div className="map-grid-item">
                <div id="map" style={{ width: '100%', height: '100%' }} />
                <div id="distanceWindow" className="map-info">
                    <div>
                        <span>Distance</span>
                        <button id="distanceWindowClose" type="button" className="close map-distance-window">&times;</button>
                    </div>
                    <div id="distance" style={{ height: 'auto', textAlign: 'center', verticalAlign: 'middle' }} />
                </div>
                <div className="map-please-wait" id="pleaseWait">
                    <div className="spinner-border text-primary m-2 map-please-wait-spinner" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <ElevationChart />
            <div className="controls-grid-item">
                <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item"><a className="nav-link active" data-toggle="tab" href="#schedule">Schedule</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#trailConditions">Trail Conditions</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#hikerProfiles">Hiker Profiles</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#equipment">Gear</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#resupply" onClick={loadResupply}>Resupply</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#todoList">To-do</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#notes">Notes</a></li>
                    <li className="nav-item"><a className="nav-link" data-toggle="tab" href="#waypoints">Route</a></li>
                </ul>
                <div className="tab-content" style={{ overflowY: 'scroll', width: '100%', height: '100%' }}>
                    <div id="schedule" className="tab-pane fade show active" />
                    <div id="hikerProfiles" className="tab-pane fade">
                        <table className="table table-condensed">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'right' }}>
                                        Start
                                        <br />
                                        Day
                                    </th>
                                    <th style={{ textAlign: 'right' }}>
                                        End
                                        <br />
                                        Day
                                    </th>
                                    <th style={{ textAlign: 'right' }}>
                                        Speed
                                        <br />
                                        Factor
                                    </th>
                                    <th style={{ textAlign: 'right' }}>
                                        Start
                                        <br />
                                        Time
                                    </th>
                                    <th style={{ textAlign: 'right' }}>
                                        End
                                        <br />
                                        Time
                                    </th>
                                    <th style={{ textAlign: 'right' }}>
                                        Break
                                        <br />
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="hikerProfilesTable">
                                <tr id="hikerProfileLastRow">
                                    <td>
                                        <button type="button" className="btn btn-sm" onClick={addHikerProfile}>
                                            <i className="fas fa-plus" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
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
        </div>
    );
};

const App = () => (
    <>
        <Menubar />
        <Hike />
    </>
);

const ConnectedApp = connect()(App);

ReactDOM.render(
    <Provider store={store}>
        <ConnectedApp />
    </Provider>,
    document.querySelector('.app'),
);
