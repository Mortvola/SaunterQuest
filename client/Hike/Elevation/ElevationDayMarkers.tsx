import React, { ReactElement } from 'react';
import { observer } from 'mobx-react-lite';
import ElevationDayMarker from './ElevationDayMarker';
import { Day } from '../../state/Types';
import { useStores } from '../../state/store';

type Props = {
  days: Array<Day>;
  chart: google.visualization.LineChart | null;
}

const ElevationDayMarkers = ({
  days,
  chart,
}: Props): ReactElement | null => {
  const { uiState } = useStores();

  if (days && chart && uiState.showMarkers.get('day')) {
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

export default observer(ElevationDayMarkers);
