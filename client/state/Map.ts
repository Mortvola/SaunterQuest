import { makeAutoObservable } from 'mobx';
import { LatLng } from './Types';

class Map {
  locationPopup: LatLng | null = null;

  private leafletMap: L.Map | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  showLocationPopup(latlng: LatLng | null): void {
    this.locationPopup = latlng;
  }

  setLeafletMap(leafletMap: L.Map): void {
    this.leafletMap = leafletMap;
  }

  getLeafLetMap(): L.Map | null {
    return this.leafletMap;
  }
}

export default Map;
