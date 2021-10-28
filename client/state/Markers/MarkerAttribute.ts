import { makeObservable, observable } from 'mobx';
import { LatLng, MapMarkerInterface, MarkerAttributeTypes } from '../Types';

class MarkerAttribute {
  type: MarkerAttributeTypes;

  latLng: LatLng;

  label: string | null = null;

  moveable: boolean;

  mapMarker: MapMarkerInterface | null = null;

  constructor(type: MarkerAttributeTypes, latLng: LatLng, moveable: boolean) {
    this.type = type;
    this.latLng = latLng;
    this.moveable = moveable;

    makeObservable(this, {
      latLng: observable,
    });
  }

  move = async (latLng: LatLng): Promise<LatLng> => {
    if (this.moveable) {
      this.latLng = latLng;
    }

    return latLng;
  }
}

export default MarkerAttribute;
