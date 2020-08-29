import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import 'regenerator-runtime/runtime';
import store from '../redux/store';
import { requestRoute, requestSchedule } from '../redux/actions';
import Menubar from '../Menubar';
import ElevationChart from './elevationChart';
import Map from './Map';
import Controls from './Controls';

const Hike = () => (
    <div className="hike-grid">
        <Map />
        <ElevationChart />
        <Controls />
    </div>
);

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
