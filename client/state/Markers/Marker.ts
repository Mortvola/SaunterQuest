import { makeObservable, observable } from 'mobx';
import { LatLng, MapMarkerInterface, MarkerTypes } from '../Types';

class Marker {
  type: MarkerTypes;

  latLng: LatLng;

  mapMarker: MapMarkerInterface | null = null;

  constructor(type: MarkerTypes, latLng: LatLng) {
    this.type = type;
    this.latLng = latLng;

    makeObservable(this, {
      latLng: observable,
    });
  }
}

export default Marker;
