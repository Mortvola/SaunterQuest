import React from 'react';
import { MarkerInterface } from '../../../state/Types';
import MarkerAttribute from './MarkerAttribute';

type PropsType = {
  marker: MarkerInterface | null
}

const MarkerAttributes: React.FC<PropsType> = ({ marker }) => (
  <>
    {
      marker && marker.markerAttributes().map((ma, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <MarkerAttribute key={index} attribute={ma} />
      ))
    }
  </>
);

export default MarkerAttributes;
