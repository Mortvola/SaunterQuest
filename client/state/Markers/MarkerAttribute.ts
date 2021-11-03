import { makeObservable, observable } from 'mobx';
import { LatLng, MarkerInterface, MarkerAttributeTypes } from '../Types';

class MarkerAttribute {
  type: MarkerAttributeTypes;

  latLng: LatLng;

  label: string | null = null;

  moveable: boolean;

  mapMarker: MarkerInterface | null = null;

  constructor(type: MarkerAttributeTypes, latLng: LatLng, moveable: boolean) {
    this.type = type;
    this.latLng = latLng;
    this.moveable = moveable;

    makeObservable(this, {
      latLng: observable,
    });
  }

  async move(latLng: LatLng): Promise<LatLng> {
    if (this.moveable) {
      this.latLng = latLng;
    }

    return latLng;
  }

  remove() {
    if (this.mapMarker) {
      this.mapMarker.removeMarkerAttribute(this);
    }
  }
}

export default MarkerAttribute;
