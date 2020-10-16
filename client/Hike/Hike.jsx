import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ElevationChart from './ElevationChart';
import Map from './Map';
import Controls from './Controls';
import { requestRoute } from '../redux/actions';

const mapStateToProps = (state) => ({
  hikeId: state.selections.params.hikeId,
  route: state.map.route,
  bounds: state.map.bounds,
  dayMarkers: state.map.dayMarkers,
  elevations: state.map.elevations,
});

const Hike = ({
  hikeId,
  route,
  bounds,
  elevations,
  tileServerUrl,
  dayMarkers,
  extendedMenu,
  dispatch,
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      dispatch(requestRoute(hikeId));
    }
  });

  if (hikeId) {
    return (
      <div className="hike-grid">
        <Map
          tileServerUrl={tileServerUrl}
          hikeId={hikeId}
          route={route}
          bounds={bounds}
          dayMarkers={dayMarkers}
          dispatch={dispatch}
        />
        <ElevationChart elevations={elevations} />
        <Controls hikeId={hikeId} />
      </div>
    );
  }

  return null;
};

Hike.propTypes = {
  hikeId: PropTypes.number,
  route: PropTypes.arrayOf(PropTypes.shape()),
  bounds: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  elevations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  tileServerUrl: PropTypes.string.isRequired,
  extendedMenu: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

Hike.defaultProps = {
  hikeId: null,
  route: null,
  bounds: null,
  dayMarkers: null,
  elevations: null,
  extendedMenu: false,
};

export default connect(mapStateToProps)(Hike);
