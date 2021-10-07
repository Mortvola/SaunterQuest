import { createElementHook, LeafletContextInterface, useLeafletContext } from '@react-leaflet/core';
import { DivIcon, Marker } from 'leaflet';
import { useEffect } from 'react';

type LatLng = { lat: number, lng: number};

type PropsType = {
  position: LatLng,
  icon: DivIcon,
  title?: string,
}

const useClusterableMarkerHook = createElementHook((
  { position, title, ...options }: { position: LatLng, title?: string },
  context: LeafletContextInterface,
) => {
  const marker = new Marker(position, options);
  if (title) {
    marker.bindTooltip(title);
  }

  return ({ instance: marker, context });
});

const ClusterableMarker = (props: PropsType): null => {
  const context = useLeafletContext();
  const elementRef = useClusterableMarkerHook(props, context);

  useEffect(() => {
    const container = context.layerContainer || context.map;
    container.addLayer(elementRef.current.instance);

    const { instance } = elementRef.current;
    return () => container.removeLayer(instance);
  }, [context.layerContainer, context.map, elementRef]);

  return null;
};

export default ClusterableMarker;
