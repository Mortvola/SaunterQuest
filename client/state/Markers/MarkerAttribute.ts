import { makeObservable, observable } from 'mobx';
import {
  LatLng, MarkerInterface, MarkerAttributeTypes, MarkerAttributeInterface,
} from '../Types';

class MarkerAttribute implements MarkerAttributeInterface {
  type: MarkerAttributeTypes;

  latLng: LatLng;

  label: string | null = null;

  moveable: boolean;

  deletable: boolean;

  mapMarker: MarkerInterface | null = null;

  constructor(type: MarkerAttributeTypes, latLng: LatLng, moveable: boolean, deletable: boolean) {
    this.type = type;
    this.latLng = latLng;
    this.moveable = moveable;
    this.deletable = deletable;

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

  remove(): void {
    if (this.mapMarker) {
      this.mapMarker.removeMarkerAttribute(this);
    }
  }

  async delete(): Promise<void> {
    this.remove();
  }
}

export default MarkerAttribute;
