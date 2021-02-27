import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import ElevationDayMarker from './ElevationDayMarker';
import { Day } from '../../state/Types';

type Props = {
  days: Array<Day>;
  chart: google.visualization.LineChart | null;
}

const ElevationDayMarkers = ({
  days,
  chart,
}: Props): ReactElement | null => {
  if (days && chart) {
    return (
      <>
        {
          days.map((d, index) => (
            index > 0
              ? <ElevationDayMarker key={d.day} day={d} chart={chart} />
              : null
          ))
        }
      </>
    );
  }

  return null;
};

// ElevationDayMarkers.propTypes = {
//   days: PropTypes.arrayOf(PropTypes.shape()),
//   chart: PropTypes.shape(),
// };

// ElevationDayMarkers.defaultProps = {
//   days: null,
//   chart: null,
// };

export default ElevationDayMarkers;
