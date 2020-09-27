import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ElevationChart from './ElevationChart';
import Map from './Map';
import Controls from './Controls';
import { requestRoute, setMap } from '../redux/actions';
import Route from './route';
import { mapInitialize } from './hike';

const mapStateToProps = (state) => ({
    hikeId: state.selections.params.hikeId,
    route: state.map.route,
});

const Hike = ({
    hikeId,
    route,
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            setInitialized(true);
            const map = mapInitialize(hikeId);

            dispatch(setMap(map));
            dispatch(requestRoute(hikeId, new Route(hikeId, map)));
        }
    });

    if (hikeId) {
        return (
            <div className="hike-grid">
                <Map />
                <ElevationChart route={route} />
                <Controls hikeId={hikeId} />
            </div>
        );
    }

    return null;
};

Hike.propTypes = {
    hikeId: PropTypes.number,
    route: PropTypes.shape(),
    dispatch: PropTypes.func.isRequired,
};

Hike.defaultProps = {
    hikeId: null,
    route: null,
};

export default connect(mapStateToProps)(Hike);