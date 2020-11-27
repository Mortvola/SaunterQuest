import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ElevationChart from './ElevationChart';
import Map from './Map';
import Controls from './Controls';
import { requestRoute } from '../redux/actions';

const mapStateToProps = (state) => ({
  hike: state.hikes.getHike(state.selections.params.hikeId),
  route: state.map.route,
  bounds: state.map.bounds,
  dayMarkers: state.map.dayMarkers,
  locationPopup: state.map.locationPopup,
  elevations: state.map.elevations,
});

const Hike = ({
  hike,
  route,
  bounds,
  elevations,
  tileServerUrl,
  dayMarkers,
  locationPopup,
  dispatch,
}) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      dispatch(requestRoute(hike.id));
    }
  });

  if (hike) {
    return (
      <div className="hike-grid">
        <Map
          tileServerUrl={tileServerUrl}
          hikeId={hike.id}
          route={route}
          bounds={bounds}
          dayMarkers={dayMarkers}
          locationPopup={locationPopup}
          dispatch={dispatch}
        />
        <ElevationChart elevations={elevations} />
        <Controls hike={hike} />
      </div>
    );
  }

  return null;
};

Hike.propTypes = {
  hike: PropTypes.shape(),
  route: PropTypes.arrayOf(PropTypes.shape()),
  bounds: PropTypes.shape(),
  dayMarkers: PropTypes.arrayOf(PropTypes.shape()),
  locationPopup: PropTypes.shape(),
  elevations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  tileServerUrl: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

Hike.defaultProps = {
  hike: null,
  route: null,
  bounds: null,
  dayMarkers: null,
  locationPopup: null,
  elevations: null,
};

export default connect(mapStateToProps)(Hike);
