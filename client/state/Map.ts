import { makeAutoObservable } from 'mobx';
import Marker from './Marker';
import {
  HikeInterface, LatLng, MapInterface, MarkerAttributeInterface,
} from './Types';

class Map implements MapInterface {
  locationPopup: LatLng | null = null;

  markers: Marker[] = [];

  #leafletMap: L.Map | null = null;

  hike: HikeInterface;

  waiting = false;

  constructor(hike: HikeInterface) {
    this.hike = hike;

    makeAutoObservable(this);
  }

  addMarker(marker: MarkerAttributeInterface): void {
    let mapMarker = this.markers.find((m) => (
      m.latLng.lat === marker.latLng.lat
      && m.latLng.lng === marker.latLng.lng
    ));

    if (!mapMarker) {
      mapMarker = new Marker(marker.latLng, this);
      this.markers.push(mapMarker);
    }

    mapMarker.addMarker(marker);
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
