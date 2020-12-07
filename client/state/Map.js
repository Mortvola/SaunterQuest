import { makeAutoObservable } from 'mobx';

class Map {
  constructor() {
    this.locationPopup = null;

    makeAutoObservable(this);
  }

  showLocationPopup(latlng) {
    this.locationPopup = latlng || null;
  }
}

export default Map;
