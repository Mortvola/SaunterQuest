import React, { ReactElement } from 'react';
import { MarkerAttributeTypes } from '../state/Types';
import { useStores } from '../state/store';
import * as Icons from './Map/Icons';

type PropsType = {
  type: MarkerAttributeTypes,
}

const POIToggle = ({
  type,
}: PropsType): ReactElement => {
  const { uiState } = useStores();

  const handlToggle = () => {
    uiState.toggleMarker(type);
  };

  type Image = {
    src: string,
    alt: string,
  }

  const markerImages = new Map<MarkerAttributeTypes, Image>([
    ['day', { src: Icons.moon, alt: 'moon' }],
    ['water', { src: Icons.water, alt: 'water' }],
    ['waypoint', { src: Icons.compass, alt: 'waypoint' }],
    ['campsite', { src: Icons.campsite, alt: 'campsite' }],
    ['resupply', { src: Icons.resupply, alt: 'resupply' }],
  ]);

  let src;
  let alt;
  const image = markerImages.get(type);
  if (image) {
    src = image.src;
    alt = image.alt;
  }

  return (
    <input
      type="image"
      onClick={handlToggle}
      style={{ padding: '3px 3px' }}
      src={src}
      alt={alt}
    />
  );
};

export default POIToggle;
