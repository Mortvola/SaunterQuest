import L from 'leaflet';
import { LatLng } from './state/Types';

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

export function createIcon(
  iconUrl: string | null | (string | null)[],
  label?: string | null,
): L.DivIcon {
  let html = ''; // '<div style="display: flex;flex-direction: column; width: max-content; height: max-content; background: #263a7a; border-radius: 12px;">';

  // let iconCount = 1;

  if (Array.isArray(iconUrl)) {
    iconUrl.forEach((url) => {
      html += `<img src="${url}" style="z-index:297">`;
    });

    // iconCount = iconUrl.length;
  }
  else {
    html += `<img src="${iconUrl}">`;
  }

  // html += '</div>'
  // eslint-disable-next-line max-len
  //   + '<div style="height: max-content;display: flex;justify-content: center;cursor: default;margin-top: -4px;">'
  //   + '<img src="/black-pin.svg" style="z-index:296">'
  //   + '</div>';

  // let labelHeight = 0;
  // if (label) {
  // eslint-disable-next-line max-len
  //   html = `<div style="display:flex;min-width:100%;justify-content:center"><div class="trail-marker-label" style="z-index:298">${label || ''}</div></div>${html}`;
  //   labelHeight = 16;
  // }

  // html = `<div style="display:flex;flex-direction:column;align-items:center">${html}</div>`;

  return L.divIcon({
    className: 'trail-marker',
    html,
    iconSize: undefined,
    iconAnchor: L.point(12, 12),
    popupAnchor: L.point(0, -32),
    tooltipAnchor: L.point(0, 0),
  });
}

// <div
//   class="leaflet-marker-icon trail-marker leaflet-zoom-animated leaflet-interactive"
//   tabindex="0"
// eslint-disable-next-line max-len
//   style="height: max-content; transform: translate3d(341px, 6px, 0px); z-index: 6; width: max-content; border-radius: 6px;"
// >
// eslint-disable-next-line max-len
//   <div style="display: flex; width: max-content; height: max-content; background: #263a7a; border-radius: 12px;">
//     <img src="/campsite.svg">
//   </div>
// eslint-disable-next-line max-len
//   <div style="height: max-content;display: flex;justify-items: center;justify-content: center;cursor: default;">
//     <img src="/pin_base.png">
//   </div>
// </div>
