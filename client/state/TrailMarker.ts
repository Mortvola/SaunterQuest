import L from 'leaflet';
import { makeAutoObservable } from 'mobx';

class TrailMarker {
  icon: L.DivIcon;

  iconUrl: string;

  marker: unknown;

  label: string | undefined;

  infoMessageCallback: unknown;

  constructor(iconUrl: string, label?: string) {
    this.iconUrl = iconUrl;
    this.label = label;
    this.icon = this.createIcon(label);
    this.marker = null;

    // this.marker = new L.Marker([],
    //   {
    //     icon: this.icon,
    //   });

    // this.marker.bindPopup(
    //   () => {
    //     let message = this.infoMessage();

    //     if (this.infoMessageCallback) {
    //       message += this.infoMessageCallback();
    //     }

    //     return message;
    //   },
    // );

    makeAutoObservable(this);
  }

  createIcon(label?: string): L.DivIcon {
    let html = `<img src="${this.iconUrl}">`;
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

  // addListener() {
  //   this.marker.off('click');

  //   this.marker.on('click', () => {
  //     if (!controlDown) {
  //       this.marker.openPopup();
  //     }
  //   });
  // }

  // removeListener() {
  //   this.marker.off('click');
  // }

  // setDraggable(draggable, listener) {
  //   if (draggable) {
  //     const trailMarker = this;

  //     this.dragListener = this.marker.on('dragend', () => {
  //       if (listener) {
  //         listener(trailMarker);
  //       }
  //     });
  //   }

  //   this.marker.options.draggable = draggable;
  // }

  // setPosition(position) {
  //   if (position !== undefined) {
  //     this.meters = position.dist;
  //     this.ele = position.ele;
  //     this.marker.setLatLng(position);

  //     // if (this.map) {
  //     //   this.marker.addTo(this.map);
  //     // }

  //     this.addListener();
  //   }
  // }

  // getPosition() {
  //   return this.marker.getLatLng();
  // }

  // removeMarker() {
  //   this.marker.remove();
  //   this.removeListener();
  // }

  infoMessage(): string | undefined {
    return this.getCommonInfoDivs();
  }

  setInfoMessageCallback(callback: unknown): void {
    this.infoMessageCallback = callback;
  }

  getCommonInfoDivs(): string | undefined {
    return this.label;
    // const position = this.marker.getLatLng();

    // return `<div>Mile: ${metersToMilesRounded(this.meters)
    // }</div><div>Elevation: ${metersToFeet(this.ele)}\'</div>`
    //         + `<div>Lat: ${position.lat}</div>`
    //         + `<div>Lng: ${position.lng}</div>`;
  }

  // setContextMenu(contextMenu) {
  //   this.marker.bindContextMenu({ contextmenu: true, contextmenuItems: contextMenu });
  // }

  // setIcon(iconUrl) {
  //   this.marker.setIcon(
  //     L.icon(
  //       {
  //         iconUrl,
  //         iconAnchor: L.point(16, 32),
  //         popupAnchor: L.point(0, -32),
  //         tooltipAnchor: L.point(0, -32),
  //       },
  //     ),
  //   );
  // }

  setLabel(label: string | undefined): void {
    this.icon = this.createIcon(label);

    // this.marker.setIcon(this.icon);

    this.label = label;
  }

  getLabel(): string | undefined {
    return this.label;
  }
}

export default TrailMarker;
