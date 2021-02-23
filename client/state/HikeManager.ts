import { makeAutoObservable } from 'mobx';
import Hike from './Hike';
import { httpDelete, postJSON } from './Transports';

class HikeManager {
  hikes: Array<Hike> = [];

  requesting = false;

  constructor() {
    makeAutoObservable(this);

    this.requestHikes();
  }

  async requestHikes(): Promise<void> {
    this.setRequesting(true);

    const response = await fetch('/hikes');

    if (response.ok) {
      const hikes = await response.json();

      if (Array.isArray(hikes)) {
        hikes.sort((a, b) => {
          const nameA = a.name.toUpperCase(); // ignore upper and lowercase
          const nameB = b.name.toUpperCase(); // ignore upper and lowercase

          if (nameA < nameB) {
            return -1;
          }

          if (nameA > nameB) {
            return 1;
          }

          // names must be equal
          return 0;
        });

        this.setHikes(hikes);
        this.setRequesting(false);
      }
    }
  }

  setRequesting(requesting: boolean): void {
    this.requesting = requesting;
  }

  setHikes(hikes: Array<Hike>): void {
    this.hikes = hikes.map((h) => (
      new Hike(h)
    ));
  }

  async addHike(hike: Hike): Promise<Hike> {
    const response = await postJSON('hike', hike);

    if (response.ok) {
      const body = await response.json();

      const newHike = new Hike(body);

      this.setHikes([
        ...this.hikes,
        newHike,
      ]);

      return newHike;
    }

    throw new Error('invalid response');
  }

  getHike(id: number): Hike {
    const hike = this.hikes.find((h) => h.id === id);

    if (hike) {
      return hike;
    }

    throw new Error('hike not found');
  }

  async deleteHike(id: number): Promise<void> {
    const response = await httpDelete(`hike/${id}`);

    if (response.ok) {
      const index = this.hikes.findIndex((h) => h.id === id);

      if (index !== -1) {
        this.setHikes([
          ...this.hikes.slice(0, index),
          ...this.hikes.slice(index + 1),
        ]);
      }
    }
  }
}

export default HikeManager;
