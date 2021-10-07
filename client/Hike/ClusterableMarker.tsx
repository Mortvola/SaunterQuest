import { createElementHook, LeafletContextInterface, useLeafletContext } from '@react-leaflet/core';
import { DivIcon, Marker } from 'leaflet';
import { useEffect } from 'react';

type LatLng = { lat: number, lng: number};

type TestMarkerProps = {
  position: LatLng,
  icon: DivIcon,
}

const createClusterableMarker = (
  { position, ...options }: { position: LatLng },
  context: LeafletContextInterface,
) => (
  { instance: new Marker(position, options), context }
);

const useClusterableMarkerHook = createElementHook(createClusterableMarker);

const ClusterableMarker = (props: TestMarkerProps): null => {
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
