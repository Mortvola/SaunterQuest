import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mapInitialize } from './hike';

const Map = ({
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            mapInitialize(dispatch);
        }
    });

    return (
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
    );
};

Map.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Map);
