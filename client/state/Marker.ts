import { makeObservable, observable, runInAction } from 'mobx';
import {
  LatLng, MapInterface, MarkerInterface, MarkerAttributeInterface, MarkerType, PointOfInterestInterface,
} from './Types';

class Marker implements MarkerInterface {
  latLng: LatLng;

  type: MarkerType;

  moveable: boolean;

  deletable: boolean;

  label: string | null = null;

  #attributes: MarkerAttributeInterface[] = [];

  #map: MapInterface;

  #poi: PointOfInterestInterface;

  constructor(
    type: MarkerType,
    latLng: LatLng,
    moveable: boolean,
    deletable: boolean,
    map: MapInterface,
    poi: PointOfInterestInterface,
  ) {
    this.type = type;
    this.latLng = latLng;
    this.moveable = moveable;
    this.deletable = deletable;
    this.#map = map;
    this.#poi = poi;

    makeObservable(this, {
      latLng: observable,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getName(): string {
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  delete(): void {
    console.log(`delete marker: ${this.type}`);
    this.#poi.delete();
  }

  remove(): void {
    // this.#map.removeMarker(this);
  }

  async move(latLng: LatLng): Promise<LatLng> {
    this.#map.setWaiting(true);

    try {
      const anchor = this.#attributes.find((m) => ['waypoint', 'start', 'finish'].includes(m.type));

      if (anchor) {
        const newLatLng = await anchor.move(latLng);

        runInAction(() => {
          this.#attributes.forEach((m) => {
            if (m !== anchor) {
              m.move(newLatLng);
            }
          });

          this.latLng = newLatLng;

          this.#map.setWaiting(false);
        });
      }
      else {
        this.#attributes.forEach((m) => m.move(latLng));
        this.latLng = latLng;
        this.#map.setWaiting(false);
      }
    }
    catch (error) {
      this.#map.setWaiting(false);
    }

    return latLng;
  }

  types(): MarkerType[] {
    return [this.type];
  }

  popup(): string | null {
    return this.label;
  }

  getLabel(): string | null {
    return this.label;
  }
}

export default Marker;
