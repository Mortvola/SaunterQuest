import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import HikeItem from './HikeItem';
import { HikeManagerInterface } from './Types';
import { Store } from './store';
import { HikeProps } from '../../common/ResponseTypes';

class HikeManager implements HikeManagerInterface {
  hikes: HikeItem[] = [];

  requesting = false;

  store: Store;

  constructor(store: Store) {
    makeAutoObservable(this);

    this.store = store;
  }

  async requestHikes(): Promise<void> {
    this.setRequesting(true);

    const response = await Http.get('/api/hikes');

    if (response.ok) {
      const hikes = await response.body();

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

  setHikes(hikes: HikeItem[]): void {
    this.hikes = hikes.map((h) => (
      new HikeItem(h)
    ));
  }

  async addHike(): Promise<HikeProps> {
    const response = await Http.post<void, HikeProps>('/api/hike');

    if (response.ok) {
      const body = await response.body();

      const newHike = new HikeItem(body);

      runInAction(() => {
        const index = this.hikes.findIndex((h) => h.name.localeCompare(newHike.name) > 0);
        if (index === -1) {
          this.hikes.concat(newHike);
        }
        else {
          this.hikes.splice(index, 0, newHike);
        }
      });

      return body;
    }

    throw new Error('invalid response');
  }

  getHike(id: number): HikeItem {
    const hike = this.hikes.find((h) => h.id === id);

    if (hike) {
      return hike;
    }

    throw new Error('hike not found');
  }

  async deleteHike(id: number): Promise<void> {
    const response = await Http.delete(`/api/hike/${id}`);

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
