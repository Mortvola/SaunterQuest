import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createLayerComponent, LeafletContextInterface } from '@react-leaflet/core';

const createGraticuleLayer = (props: unknown, context: LeafletContextInterface) => {
  const { map } = context; // useMap();
  let canvas: HTMLCanvasElement | null = null;

  const renderGrid = () => {
    if (canvas) {
      const offset = map.containerPointToLayerPoint(L.point(0, 0));
      const size = map.getSize();
      canvas.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      canvas.width = size.x;
      canvas.height = size.y;

      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Below minZoom we start discarding lat/lng lines
        // Above maxZoom we stop subdividing lat/lng lines
        const minZoom = 8;
        const maxZoom = 13;
        const delta = 2 ** (minZoom - Math.min(map.getZoom(), maxZoom));

        const bounds = map.getBounds();

        const south = Math.ceil(bounds.getSouth() / delta) * delta;
        const north = Math.floor(bounds.getNorth() / delta) * delta;
        const west = Math.ceil(bounds.getWest() / delta) * delta;
        const east = Math.floor(bounds.getEast() / delta) * delta;

        // Change the weight of the grid lines as the map is zoomed out
        // and details are removed.
        if (map.getZoom() <= 11) {
          const weight = 11 - map.getZoom();
          ctx.strokeStyle = `#${weight}f${weight}f${weight}f`;
        }
        else {
          ctx.strokeStyle = '#000000';
        }

        ctx.font = '300 10px sans-serif';

        ctx.beginPath();
        for (let i = west; i <= east; i += delta) {
          let point = map.latLngToContainerPoint(L.latLng(bounds.getNorth(), i));
          ctx.moveTo(point.x, point.y);
          ctx.fillText(`${i}`, point.x + 5, point.y + 10);
          point = map.latLngToContainerPoint(L.latLng(bounds.getSouth(), i));
          ctx.lineTo(point.x, point.y);
          ctx.fillText(`${i}`, point.x + 5, point.y - 5);
        }

        for (let i = south; i <= north; i += delta) {
          let point = map.latLngToContainerPoint(L.latLng(i, bounds.getWest()));
          ctx.moveTo(point.x, point.y);
          ctx.fillText(`${i}`, point.x + 5, point.y - 5);
          point = map.latLngToContainerPoint(L.latLng(i, bounds.getEast()));
          ctx.lineTo(point.x, point.y);
          const { width } = ctx.measureText(`${i}`);
          ctx.fillText(`${i}`, point.x - width - 5, point.y - 5);
        }
        ctx.stroke();
      }
    }
  };

  const viewReset = () => {
    renderGrid();
  };

  const moveEnd = () => {
    renderGrid();
  };

  const Layer = L.Layer.extend({
    onAdd: (m: L.Map) => {
      const canAnimate = true; // props.leaflet.map.options.zoomAnimation && L.Browser.any3d;
      const zoomClass = `leaflet-zoom-${canAnimate ? 'animated' : 'hide'}`;
      canvas = L.DomUtil.create('canvas', zoomClass) as HTMLCanvasElement;

      canvas.width = m.getSize().x;
      canvas.height = m.getSize().y;

      m.on('viewreset', viewReset);
      m.on('moveend', moveEnd);

      renderGrid();

      return m.getPanes().overlayPane.appendChild(canvas);
    },

    onRemove: (m: L.Map) => {
      if (canvas) {
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        canvas = null;
      }

      m.off('viewreset', viewReset);
      m.off('moveend', moveEnd);
    },
  });

  const instance = new Layer();

  return { instance, context: { ...context, overlayContainer: instance } };
};

export default createLayerComponent(createGraticuleLayer);
