import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import 'regenerator-runtime/runtime';
import { getHikes, showHikeDialog } from './home';

const App = () => {
    const [initialized, setInitialized] = useState(false);

    if (!initialized) {
        setInitialized(true);
        getHikes();
    }

    return (
        <div className="row no-gutters" style={{ height: '100%' }}>
            <div className="col-md-12" style={{ overflowY: 'scroll', height: '100%' }}>
                <h4>
                    Hikes
                    <button type="button" className="btn btn-sm" onClick={showHikeDialog}>
                        <i className="fas fa-plus" />
                    </button>
                </h4>
                <div className="hikes" />
                <div className="map-please-wait" id="pleaseWait">
                    <div className="spinner-border text-primary m-2 map-please-wait-spinner" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(
    <App />,
    document.querySelector('.app'),
);
