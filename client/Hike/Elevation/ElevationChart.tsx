import React, {
  useEffect, useRef, useState,
} from 'react';
import L from 'leaflet';
import { observer } from 'mobx-react-lite';
import Chart from 'react-google-charts';
import { ReactGoogleChartEvent, GoogleChartWrapper, GoogleVizEventName } from 'react-google-charts/dist/types';
import { GoogleChart } from './GoogleChart';
import { HikeLegInterface } from '../../state/Types';

type PropsType = {
  hikeLeg: HikeLegInterface;
}

const ElevationChart: React.FC<PropsType> = ({
  hikeLeg,
}) => {
  const [chart, setChart] = useState<GoogleChart | null>(null);
  const elevationData: Array<Array<unknown | number>> = [
    [
      { label: 'Distance', role: 'domain', type: 'number' },
      { label: 'Elevation', role: 'data', type: 'number' },
      { label: 'lat', role: 'data', type: 'number' },
      { label: 'lng', role: 'data', type: 'number' },
    ],
    ...(hikeLeg.route.elevations || []),
  ];

  const chartEvents: ReactGoogleChartEvent[] = [
    {
      eventName: 'ready',
      callback({ chartWrapper, google }) {
        const readyChart = (chartWrapper.getChart() as unknown) as GoogleChart;

        if (readyChart === null) {
          throw new Error('chart is null');
        }

        const eventHandler = (point: { row: number, column: number}) => {
          if (elevationData[point.row + 1] !== undefined) {
            if (typeof elevationData[point.row + 1][2] === 'number'
            && typeof elevationData[point.row + 1][3] === 'number') {
              hikeLeg.setElevationMarker(new L.LatLng(
                elevationData[point.row + 1][2] as number,
                elevationData[point.row + 1][3] as number,
              ));
            }
          }
        };

        google.visualization.events.addListener(
          readyChart as any,
          'onmouseover' as GoogleVizEventName,
          (eventHandler as unknown) as (chartWrapper: GoogleChartWrapper) => void,
        );

        google.visualization.events.addListener(
          readyChart as any,
          'onmouseout' as GoogleVizEventName,
          () => {
            hikeLeg.setElevationMarker(null);
          },
        );

        google.visualization.events.addListener(
          chartWrapper,
          'select',
          () => {
            console.log('mouse select');
          },
        );

        setChart(readyChart);
      },
    },
  ];

  const divRef = useRef<HTMLDivElement | null>(null);

  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const element = divRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();

      setHeight(rect.height);
    }
  }, []);

  return (
    <div ref={divRef} style={{ height: '100%', width: '100%' }}>
      <Chart
        chartType="LineChart"
        data={elevationData}
        height={height}
        options={{
          legend: { position: 'none' },
          focusTarget: 'datum',
          chartArea: {
            left: 40,
            top: 20,
            bottom: 30,
            right: 0,
            width: '100%',
            height: '100%',
          },
        }}
        chartWrapperParams={{ view: { columns: [0, 1] } }}
        chartEvents={chartEvents}
      />
    </div>
  );
};

export default observer(ElevationChart);
