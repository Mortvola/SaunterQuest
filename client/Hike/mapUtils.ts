import L from 'leaflet';
import { LatLng } from '../state/Types';

export function positionMapToBounds(map: L.Map, p1: LatLng, p2: LatLng): void {
  type Bounds = {
    east?: number,
    west?: number,
    north?: number,
    south?: number,
  };

  const bounds: Bounds = {};

  if (p1.lng < p2.lng) {
    bounds.east = p2.lng;
    bounds.west = p1.lng;
  }
  else {
    bounds.east = p1.lng;
    bounds.west = p2.lng;
  }

  if (p1.lat < p2.lat) {
    bounds.north = p2.lat;
    bounds.south = p1.lat;
  }
  else {
    bounds.north = p1.lat;
    bounds.south = p2.lat;
  }

  map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]);
}

export function createIcon(iconUrl: string, label?: string): L.DivIcon {
  let html = `<img src="${iconUrl}">`;
  if (label) {
    html = `<div class="trail-marker-label">${label || ''}</div>${html}`;
  }

  return L.divIcon(
    {
      className: 'trail-marker',
      html,
      iconAnchor: L.point(16, 32),
      popupAnchor: L.point(0, -32),
      tooltipAnchor: L.point(0, -32),
    },
  );
}
