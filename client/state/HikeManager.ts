import { makeAutoObservable, runInAction } from 'mobx';
import Hike from './Hike';
import { httpDelete, postJSON } from './Transports';
import { HikeManagerInterface } from './Types';
import { Store } from './store';

class HikeManager implements HikeManagerInterface {
  hikes: Array<Hike> = [];

  requesting = false;

  store: Store;

  constructor(store: Store) {
    makeAutoObservable(this);

    this.store = store;

    this.requestHikes();
  }

  async requestHikes(): Promise<void> {
    this.setRequesting(true);

    const response = await fetch('/hikes');

    if (response.ok) {
      const hikes = await response.json();

      runInAction(() => {
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
      });
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

  async addHike(name: string): Promise<Hike> {
    const response = await postJSON('hike', { name });

    if (response.ok) {
      const body = await response.json();

      const newHike = new Hike(body);

      runInAction(() => {
        const index = this.hikes.findIndex((h) => h.name.localeCompare(newHike.name) > 0);
        if (index === -1) {
          this.hikes.concat(newHike);
        }
        else {
          this.hikes.splice(index, 0, newHike);
        }
      });

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
      runInAction(() => {
        const index = this.hikes.findIndex((h) => h.id === id);

        if (index !== -1) {
          this.setHikes([
            ...this.hikes.slice(0, index),
            ...this.hikes.slice(index + 1),
          ]);
        }
      });
    }
  }
}

export default HikeManager;
