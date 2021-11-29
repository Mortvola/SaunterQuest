import React from 'react';
import { MarkerInterface } from '../../../state/Types';
import Marker from './Marker';

type PropsType = {
  markers: MarkerInterface[] | null
}

const SelectedMarkers: React.FC<PropsType> = ({ markers }) => (
  <>
    {
      markers && markers.map((m, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Marker key={index} marker={m} />
      ))
    }
  </>
);

export default SelectedMarkers;
