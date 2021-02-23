import { makeAutoObservable } from 'mobx';
import { LatLng } from './Types';

class Map {
  locationPopup: LatLng | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  showLocationPopup(latlng: LatLng | null): void {
    this.locationPopup = latlng;
  }
}

export default Map;
