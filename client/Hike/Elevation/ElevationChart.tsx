import React, { ReactElement, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import Chart from 'react-google-charts';
import { ReactGoogleChartEvent } from 'react-google-charts/dist/types';
import ElevationDayMarkers from './ElevationDayMarkers';
import { Day } from '../../state/Types';
import Hike from '../../state/Hike';

type Props = {
  hike: Hike;
}

const ElevationChart = ({
  hike,
}: Props): ReactElement => {
  const [chart, setChart] = useState<google.visualization.LineChart | null>(null);
  const elevationData: Array<Array<unknown | number>> = [
    [
      { label: 'Distance', role: 'domain', type: 'number' },
      { label: 'Elevation', role: 'data', type: 'number' },
      { label: 'lat', role: 'data', type: 'number' },
      { label: 'lng', role: 'data', type: 'number' },
    ],
    ...(hike.route.elevations || []),
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

        google.visualization.events.addListener(c, 'onmouseover', (event: { column: number, row: number }) => {
          if (typeof elevationData[event.row + 1][2] === 'number'
            && typeof elevationData[event.row + 1][3] === 'number') {
            hike.setElevationMarker({
              lat: elevationData[event.row + 1][2] as number,
              lng: elevationData[event.row + 1][3] as number,
            });
          }
        });

        google.visualization.events.addListener(c, 'onmouseout', () => {
          hike.setElevationMarker(null);
        });

        google.visualization.events.addListener(c, 'select', () => {
          console.log('mouse select');
        });

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
        chartWrapperParams={{ view: { columns: [0, 1] } }}
        chartEvents={chartEvents}
      />
      <ElevationDayMarkers days={hike.schedule} chart={chart} />
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

export default observer(ElevationChart);
