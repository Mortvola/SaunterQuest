import React, { ReactElement } from 'react';
import { Day } from '../../state/Types';
import { metersToFeet, metersToMilesRounded } from '../../utilities';

type Props = {
  day: Day;
  chart: google.visualization.LineChart;
}

const ElevationDayMarker = ({
  day,
  chart,
}: Props): ReactElement => {
  const cli = chart.getChartLayoutInterface();
  const x = cli.getXLocation(metersToMilesRounded(day.startMeters)) - 15;
  const y = cli.getYLocation(metersToFeet(day.ele)) - 32;

  return (
    <img
      src="/moon_pin.png"
      alt=""
      className="elevation-day-marker"
      style={{ top: `${y}px`, left: `${x}px` }}
    />
  );
};

export default ElevationDayMarker;
