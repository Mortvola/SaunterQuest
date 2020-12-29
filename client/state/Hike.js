import { makeAutoObservable } from 'mobx';
import HikerProfile from './HikerProfile';
import Map from './Map';
import TrailMarker from '../Hike/trailMarker/trailMarker';
import Route from './Route';
import { metersToFeet, metersToMiles } from '../utilities';

const dayMarkerUrl = 'moon_pin.png';

class Hike {
  constructor(props) {
    this.id = null;
    this.duration = null;
    this.distance = null;
    this.requesting = false;
    this.hikerProfiles = [];
    this.schedule = [];
    this.route = new Route(this);
    this.map = null;
    this.dayMarkers = [];

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

  async requestHikerProfiles() {
    const profiles = await fetch(`/hike/${this.id}/hiker-profile`)
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    this.setHikerProfiles(profiles.map((p) => new HikerProfile(p)));
  }

  load() {
    this.map = new Map(this);
  }

  setHikerProfiles(profiles) {
    this.hikerProfiles = profiles;
  }

  addHikerProfile(profile) {
    this.hikerProfiles.push(profile);
  }

  async deleteHikerProfile(id) {
    const deleted = await fetch(`/hike/${this.id}/hiker-profile/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    })
      .then(async (response) => {
        if (response.ok) {
          return true;
        }

        return false;
      });

    if (deleted) {
      const index = this.hikerProfiles.findIndex((p) => p.id === id);

      if (index !== -1) {
        this.setHikerProfiles([
          ...this.hikerProfiles.slice(0, index),
          ...this.hikerProfiles.slice(index + 1),
        ]);
      }
    }

    // todo: handle the error case.
  }

  async requestSchedule() {
    try {
      const schedule = await fetch(`/hike/${this.id}/schedule`)
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }

          return null;
        });

      this.setSchedule(schedule);
      this.setDayMarkers(schedule);
    }
    catch (error) {
      console.log(error);
    }
  }

  setSchedule(schedule) {
    this.schedule = schedule;
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

  setDayMarkers(schedule) {
    let miles = metersToMiles(schedule[0].meters);
    this.dayMarkers = schedule.filter((d, index) => index > 0).map((d, index) => {
      const day = {
        id: d.id,
        day: index + 1,
        lat: d.lat,
        lng: d.lng,
        miles,
        ele: metersToFeet(d.ele),
        marker: new TrailMarker(
          dayMarkerUrl,
        ),
      };

      miles += metersToMiles(d.meters);

      return day;
    });
  }
}

export default Hike;
