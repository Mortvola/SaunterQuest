import { makeAutoObservable } from 'mobx';

class Hike {
  constructor(props) {
    this.id = null;
    this.duration = null;
    this.distance = null;
    this.requesting = false;

    makeAutoObservable(this);

    if (props) {
      Object.keys(props).forEach((key) => {
        this[key] = props[key];
      });
    }

    this.requestDetails();
  }

  async requestDetails() {
    this.setRequesting(true);
    const details = await fetch(`/hike/${this.id}/details`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    this.setDuration(details.duration);
    this.setDistance(details.distance);
    this.setRequesting(false);
  }

  setRequesting(requseting) {
    this.requesting = requseting;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  setDistance(distance) {
    this.distance = distance;
  }
}

export default Hike;
