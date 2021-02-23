import { makeAutoObservable } from 'mobx';

class Map {
  locationPopup: LatLng | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  showLocationPopup(latlng: LatLng): void {
    this.locationPopup = latlng || null;
  }
}

export default Map;
