import { makeAutoObservable } from 'mobx';
import Hike from './Hike';

class HikeManager {
  constructor() {
    this.hikes = [];
    this.requesting = false;

    makeAutoObservable(this);

    this.requestHikes();
  }

  async requestHikes() {
    this.setRequesting(true);
    const hikes = await fetch('/hikes')
      .then(async (response) => {
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json)) {
            json.sort((a, b) => {
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

            return json;
          }
        }

        return null;
      });

    this.setHikes(hikes);
    this.setRequesting(false);
  }

  setRequesting(requesting) {
    this.requesting = requesting;
  }

  setHikes(hikes) {
    this.hikes = hikes.map((h) => (
      new Hike(h)
    ));
  }

  async addHike(hike) {
    return fetch('hike', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        Accept: 'application/json',
      },
      body: hike,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        throw new Error('invalid response');
      })
      .then((response) => {
        const newHike = new Hike(response);

        this.setHikes([
          ...this.hikes,
          newHike,
        ]);

        return newHike;
      });
  }

  getHike(id) {
    return this.hikes.find((h) => h.id === id);
  }

  async deleteHike(id) {
    const deleted = await fetch(`hike/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    })
      .then((response) => {
        if (response.ok) {
          return true;
        }

        return false;
      });

    if (deleted) {
      const index = this.hikes.findIndex((h) => h.id === id);

      if (index !== -1) {
        this.setHikes([
          ...this.hikes.slice(0, index),
          ...this.hikes.slice(index + 1),
        ]);
      }
    }

    // todo: handle error case
  }
}

export default HikeManager;