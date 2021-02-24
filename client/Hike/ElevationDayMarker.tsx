import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Day } from '../state/Types';
import { metersToFeet } from '../utilities';

type Props = {
  day: Day;
  chart: google.visualization.LineChart;
}

const ElevationDayMarker = ({
  day,
  chart,
}: Props): ReactElement => {
  const cli = chart.getChartLayoutInterface();
  const x = cli.getXLocation(day.startMile) - 15;
  const y = cli.getYLocation(metersToFeet(day.ele)) - 32;

  return (
    <img src="moon_pin.png" alt="" style={{ top: `${y}px`, left: `${x}px`, position: 'absolute' }} />
  );
};

// ElevationDayMarker.propTypes = {
//   day: PropTypes.shape().isRequired,
//   chart: PropTypes.shape().isRequired,
// };

export default ElevationDayMarker;
