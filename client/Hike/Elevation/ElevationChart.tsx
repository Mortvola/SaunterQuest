import React, { ReactElement, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Chart from 'react-google-charts';
import { ReactGoogleChartEvent, GoogleChartWrapper, GoogleVizEventName } from 'react-google-charts/dist/types';
import ElevationDayMarkers from './ElevationDayMarkers';
import Hike from '../../state/Hike';
import { GoogleChartInterface } from './GoogleChartInterface';

type Props = {
  hike: Hike;
}

const ElevationChart = ({
  hike,
}: Props): ReactElement => {
  const [chart, setChart] = useState<GoogleChartInterface | null>(null);
  const elevationData: Array<Array<unknown | number>> = [
    [
      { label: 'Distance', role: 'domain', type: 'number' },
      { label: 'Elevation', role: 'data', type: 'number' },
      { label: 'lat', role: 'data', type: 'number' },
      { label: 'lng', role: 'data', type: 'number' },
    ],
    ...(hike.route.elevations || []),
  ];

  const chartEvents: ReactGoogleChartEvent[] = [
    {
      eventName: 'ready',
      callback({ chartWrapper, google }) {
        const c = (chartWrapper.getChart() as unknown) as GoogleChartInterface;

        if (c === null) {
          throw new Error('chart is null');
        }

        const eventHandler = (cw: GoogleChartWrapper) => {
          const [point] = cw.getSelection();

          if (elevationData[point.row + 1] !== undefined) {
            if (typeof elevationData[point.row + 1][2] === 'number'
            && typeof elevationData[point.row + 1][3] === 'number') {
              hike.setElevationMarker({
                lat: elevationData[point.row + 1][2] as number,
                lng: elevationData[point.row + 1][3] as number,
              });
            }
          }
        };

        google.visualization.events.addListener(
          chartWrapper,
          'onmouseover' as GoogleVizEventName,
          eventHandler,
        );

        google.visualization.events.addListener(
          chartWrapper,
          'onmouseout' as GoogleVizEventName,
          () => {
            hike.setElevationMarker(null);
          },
        );

        google.visualization.events.addListener(
          chartWrapper,
          'select',
          () => {
            console.log('mouse select');
          },
        );

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

export default observer(ElevationChart);
