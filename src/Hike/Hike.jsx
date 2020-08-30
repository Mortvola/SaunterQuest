import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ElevationChart from './elevationChart';
import Map from './Map';
import Controls from './Controls';

const mapStateToProps = (state) => ({
    hikeId: state.selections.params.hikeId,
});

const Hike = ({
    hikeId,
    dispatch,
}) => {
    if (hikeId) {
        return (
            <div className="hike-grid">
                <Map hikeId={hikeId} dispatch={dispatch} />
                <ElevationChart />
                <Controls hikeId={hikeId} />
            </div>
        );
    }

    return null;
};

Hike.propTypes = {
    hikeId: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
};

Hike.defaultProps = {
    hikeId: null,
};

export default connect(mapStateToProps)(Hike);
