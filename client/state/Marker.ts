import { makeAutoObservable, runInAction } from 'mobx';
import DayAttribute from './Markers/DayAttribute';
import {
  LatLng, MapInterface, MarkerInterface, MarkerAttributeInterface, MarkerAttributeTypes,
} from './Types';
import Anchor from './Markers/AnchorAttribute';
import { metersToMilesRounded } from '../utilities';

class Marker implements MarkerInterface {
  latLng: LatLng;

  #attributes: MarkerAttributeInterface[] = [];

  #map: MapInterface;

  constructor(latLng: LatLng, map: MapInterface) {
    this.latLng = latLng;
    this.#map = map;

    makeAutoObservable(this);
  }

  addMarkerAttribute(attribute: MarkerAttributeInterface): void {
    this.#attributes.push(attribute);
    attribute.mapMarker = this;
  }

  removeMarkerAttribute(attribute: MarkerAttributeInterface): void {
    const index = this.#attributes.findIndex((a) => a === attribute);

    if (index !== -1) {
      this.#attributes = [
        ...this.#attributes.slice(0, index),
        ...this.#attributes.slice(index + 1),
      ];

      // Remove the marker if there are no more attributes.
      if (this.#attributes.length === 0) {
        this.#map.removeMarker(this);
      }
    }
  }

  async move(latLng: LatLng): Promise<void> {
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
  }

  types(): MarkerAttributeTypes[] {
    return this.#attributes.map((m) => m.type);
  }

  popup(): string | null {
    const dayMarker = this.#attributes.find((m) => m.type === 'day') as DayAttribute;

    if (dayMarker) {
      return `Day ${dayMarker.day.day}\nMiles: ${metersToMilesRounded(dayMarker.day.startMeters)}`;
    }

    return null;
  }

  label(): string | null {
    const labeledMarker = this.#attributes.find((m) => m.label !== null);

    if (labeledMarker) {
      return labeledMarker.label;
    }

    return null;
  }

  markerAttributes(): MarkerAttributeInterface[] {
    return this.#attributes;
  }
}

export default Marker;
