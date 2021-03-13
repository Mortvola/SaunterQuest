import { makeAutoObservable, runInAction } from 'mobx';
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

  types(): Array<MarkerTypes> {
    return this.#markers.map((m) => m.type);
  }
}

export default MapMarker;
