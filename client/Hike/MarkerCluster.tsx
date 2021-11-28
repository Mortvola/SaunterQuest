import { createPathComponent, LeafletContextInterface } from '@react-leaflet/core';
import L, { MarkerCluster as LeafletMarkerCluster, markerClusterGroup } from 'leaflet';
import styles from './MarkerCluster.module.css';

const createCluster = (props: unknown, context: LeafletContextInterface) => {
  const createIcon = (cluster: LeafletMarkerCluster) => {
    const children = cluster.getAllChildMarkers();
    let offset = 0;
    let zIndex = children.length;
    const icons = children.reduce(
      (accum, m, index): string => {
        if (children.length - index <= 4) {
          const icon = m.getIcon();
          const html = `${accum}<div style='position: absolute; left: ${offset * 0.25}rem; z-index: ${zIndex}'>${((icon.options as L.DivIconOptions).html as string)}</div>`;
          offset += 1;
          zIndex -= 1;
          return html;
        }

        return accum;
      }, '',
    );
    return (
      L.divIcon({ className: 'trail-marker', html: `${icons}<div class='${styles.label}'>${children.length} items</div>` })
    );
  };

  const instance = markerClusterGroup({ maxClusterRadius: 60, iconCreateFunction: createIcon });
  return { instance, context: { ...context, layerContainer: instance } };
};

const MarkerCluster = createPathComponent(createCluster);

export default MarkerCluster;
