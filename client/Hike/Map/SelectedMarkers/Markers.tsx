import React from 'react';
import { PointOfInterestInterface } from '../../../state/Types';
import Marker from './Marker';

type PropsType = {
  markers: PointOfInterestInterface[] | null
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
