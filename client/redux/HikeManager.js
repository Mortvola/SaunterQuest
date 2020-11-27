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

  addHike(hike) {
    this.hikes.concat(hike);
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
        this.hikes.splice(index, 1);
      }
    }

    // todo: handle error case
  }
}

export default HikeManager;
