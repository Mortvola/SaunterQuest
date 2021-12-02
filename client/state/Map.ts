import { makeAutoObservable, runInAction } from 'mobx';
import Marker from './Marker';
import {
  HikeInterface, LatLng, MapInterface, MarkerInterface,
} from './Types';

class Map implements MapInterface {
  locationPopup: LatLng | null = null;

  markers: MarkerInterface[] = [];

  selectedMarkers: MarkerInterface[] = [];

  #leafletMap: L.Map | null = null;

  hike: HikeInterface;

  waiting = false;

  constructor(hike: HikeInterface) {
    this.hike = hike;

    makeAutoObservable(this);
  }

  setWaiting(waiting: boolean): void {
    runInAction(() => {
      this.waiting = waiting;
    });
  }

  getWaiting(): boolean {
    return this.waiting;
  }

  addMarkerSelection(marker: MarkerInterface): void {
    const index = this.selectedMarkers.findIndex((m) => m === marker);

    if (index === -1) {
      this.selectedMarkers = [
        ...this.selectedMarkers,
        marker,
      ];
    }
  }

  removeMarkerSelection(marker: MarkerInterface): void {
    const index = this.selectedMarkers.findIndex((m) => m === marker);

    if (index !== -1) {
      this.selectedMarkers = [
        ...this.selectedMarkers.slice(0, index),
        ...this.selectedMarkers.slice(index + 1),
      ];
    }
  }

  clearSelectedMarkers(): void {
    this.selectedMarkers.slice().forEach((m) => m.setSelected(false));
  }

  addMarker(marker: MarkerInterface): void {
    this.markers.push(marker);
  }

  removeMarker(marker: Marker): void {
    const index = this.markers.findIndex((m) => m === marker);

    if (index !== -1) {
      this.markers = [
        ...this.markers.slice(0, index),
        ...this.markers.slice(index + 1),
      ];
    }
  }

  showLocationPopup(latlng: LatLng | null): void {
    this.locationPopup = latlng;
  }

  setLeafletMap(leafletMap: L.Map): void {
    this.#leafletMap = leafletMap;
  }

  getLeafLetMap(): L.Map | null {
    return this.#leafletMap;
  }
}

export default Map;
