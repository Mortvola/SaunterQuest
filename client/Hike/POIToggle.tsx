import React, { ReactElement } from 'react';
import { MarkerTypes } from '../state/Types';
import { useStores } from '../state/store';

type PropsType = {
  type: MarkerTypes,
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

  const markerImages = new Map<MarkerTypes, Image>([
    ['day', { src: '/moon.svg', alt: 'moon' }],
    ['water', { src: '/water.svg', alt: 'water' }],
    ['waypoint', { src: '/compass.svg', alt: 'waypoint' }],
    ['campsite', { src: '/campsite.svg', alt: 'campsite' }],
    ['resupply', { src: '/resupply.svg', alt: 'resupply' }],
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
