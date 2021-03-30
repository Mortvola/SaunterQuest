import { makeAutoObservable, runInAction } from 'mobx';
import DayMarker from './Markers/DayMarker';
import { LatLng, MarkerInterface, MarkerTypes } from './Types';

class MapMarker {
  latLng: LatLng;

  #markers: Array<MarkerInterface> = [];

  constructor(latLng: LatLng) {
    this.latLng = latLng;

    makeAutoObservable(this);
  }

  addMarker(marker: MarkerInterface): void {
    this.#markers.push(marker);
    marker.mapMarker = this;
  }

  move = async (latLng: LatLng): Promise<void> => {
    const anchor = this.#markers.find((m) => m.type === 'waypoint');

    if (anchor) {
      const newLatLng = await anchor.move(latLng);

      runInAction(() => {
        this.#markers.forEach((m) => {
          if (m !== anchor) {
            m.move(newLatLng);
          }
        });

        this.latLng = newLatLng;
      });
    }
    else {
      this.#markers.forEach((m) => m.move(latLng));
      this.latLng = latLng;
    }
  }

  types = (): Array<MarkerTypes> => (
    this.#markers.map((m) => m.type)
  )

  popup = (): string | null => {
    const dayMarker = this.#markers.find((m) => m.type === 'day');

    if (dayMarker) {
      return `Day ${(dayMarker as DayMarker).day.day}`;
    }

    return null;
  }

  label = (): string | null => {
    const labeledMarker = this.#markers.find((m) => m.label !== null);

    if (labeledMarker) {
      return labeledMarker.label;
    }

    return null;
  }
}

export default MapMarker;
