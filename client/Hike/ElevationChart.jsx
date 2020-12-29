import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-google-charts';
import ElevationDayMarkers from './ElevationDayMarkers';

const ElevationChart = ({
  elevations,
  days,
}) => {
  const [chart, setChart] = useState(null);
  const elevationData = [
    [
      { label: 'Distance', role: 'domain', type: 'number' },
      { label: 'Elevation', role: 'data', type: 'number' },
    ],
    ...(elevations || []),
  ];

  const chartEvents = [
    {
      eventName: 'ready',
      callback({ chartWrapper }) {
        setChart(chartWrapper.getChart());
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
          vAxis: {
            viewWindow: {
              min: elevationData.min,
              max: Math.max(elevationData.max, 10),
            },
          },
        }}
        chartEvents={chartEvents}
      />
      <ElevationDayMarkers days={days} chart={chart} />
    </div>
  );
};

ElevationChart.propTypes = {
  elevations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  days: PropTypes.arrayOf(PropTypes.shape()),
};

ElevationChart.defaultProps = {
  elevations: null,
  days: null,
};

export default ElevationChart;
