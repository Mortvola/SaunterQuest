import { makeAutoObservable, runInAction } from 'mobx';
import {
  HikeInterface, MapInterface, PointOfInterestInterface,
} from './Types';

class Map implements MapInterface {
  locationPopup: L.LatLng | null = null;

  markers: PointOfInterestInterface[] = [];

  selectedMarkers: PointOfInterestInterface[] = [];

  #leafletMap: L.Map | null = null;

  hike: HikeInterface;

  temporaryMarkerLocation: L.LatLng | null = null;

  waiting = false;

  constructor(hike: HikeInterface) {
    this.hike = hike;

    makeAutoObservable(this);
  }

  setTemporaryMarkerLocation(latlng: L.LatLng): void {
    runInAction(() => {
      this.temporaryMarkerLocation = latlng;
    });
  }

  setWaiting(waiting: boolean): void {
    runInAction(() => {
      this.waiting = waiting;
    });
  }

  getWaiting(): boolean {
    return this.waiting;
  }

  addMarkerSelection(marker: PointOfInterestInterface): void {
    const index = this.selectedMarkers.findIndex((m) => m === marker);

    if (index === -1) {
      this.selectedMarkers = [
        ...this.selectedMarkers,
        marker,
      ];
    }
  }

  removeMarkerSelection(marker: PointOfInterestInterface): void {
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

  addMarker(marker: PointOfInterestInterface): void {
    this.markers.push(marker);
  }

  removeMarker(marker: PointOfInterestInterface): void {
    const index = this.markers.findIndex((m) => m === marker);

    if (index !== -1) {
      this.markers = [
        ...this.markers.slice(0, index),
        ...this.markers.slice(index + 1),
      ];
    }
  }

  showLocationPopup(latlng: L.LatLng | null): void {
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
