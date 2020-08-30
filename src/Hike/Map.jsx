import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import 'leaflet-contextmenu';
import { mapInitialize } from './hike';
import { setMap, requestRoute } from '../redux/actions';
import Route from './route';

const Map = ({
    hikeId,
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            const map = mapInitialize(hikeId);

            dispatch(setMap(map));

            const route = new Route(hikeId, map);
            dispatch(requestRoute(hikeId, route));
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
    hikeId: PropTypes.number.isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default Map;
