import React from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-google-charts';

const ElevationChart = ({
  elevations,
}) => {
  const elevationData = [
    [{ label: 'Distance', type: 'number' }, { label: 'Elevation', type: 'number' }],
    ...(elevations || []),
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
      />
    </div>
  );
};

ElevationChart.propTypes = {
  elevations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

ElevationChart.defaultProps = {
  elevations: null,
};

export default ElevationChart;
