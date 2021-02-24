import React, { ReactElement, useState } from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-google-charts';
import { ReactGoogleChartEvent } from 'react-google-charts/dist/types';
import ElevationDayMarkers from './ElevationDayMarkers';
import { Day } from '../state/Types';

type Props = {
  elevations: Array<Array<number>>;
  days: Array<Day>;
}

const ElevationChart = ({
  elevations,
  days,
}: Props): ReactElement => {
  const [chart, setChart] = useState<google.visualization.LineChart | null>(null);
  const elevationData = [
    [
      { label: 'Distance', role: 'domain', type: 'number' },
      { label: 'Elevation', role: 'data', type: 'number' },
    ],
    ...(elevations || []),
  ];

  const chartEvents: Array<ReactGoogleChartEvent> = [
    {
      eventName: 'ready',
      callback({ chartWrapper }) {
        const cw = ((chartWrapper as unknown) as google.visualization.ChartWrapper);
        const c = cw.getChart() as (google.visualization.LineChart | null);

        if (c === null) {
          throw new Error('chart is null');
        }

        setChart(c);
      },
    },
  ];

  return (
    <div className="ele-grid-item">
      <Chart
        chartType="LineChart"
        width="100%"
        height="100%"
        data={elevationData}
        options={{
          legend: { position: 'none' },
          focusTarget: 'datum',
        }}
        chartEvents={chartEvents}
      />
      <ElevationDayMarkers days={days} chart={chart} />
    </div>
  );
};

// ElevationChart.propTypes = {
//   elevations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
//   days: PropTypes.arrayOf(PropTypes.shape()),
// };

// ElevationChart.defaultProps = {
//   elevations: null,
//   days: null,
// };

export default ElevationChart;
