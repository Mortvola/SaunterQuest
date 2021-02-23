import { makeAutoObservable } from 'mobx';
import HikerProfile from './HikerProfile';
import Map from './Map';
import TrailMarker from './TrailMarker';
import Route from './Route';
import { metersToFeet, metersToMiles } from '../utilities';
import { httpDelete } from './Transports';

interface ProfileProps {
  id: number;
}

interface Days {
  id: number;
  meters: number;
  lat: number;
  lng: number;
  ele: number;
}

const dayMarkerUrl = 'moon_pin.png';

class Hike implements HikeInterface {
  id: number | null = null;

  duration: number | null = null;

  distance: number | null = null;

  requesting = false;

  hikerProfiles: Array<HikerProfile> = [];

  schedule: Array<Days> = [];

  route = new Route(this);

  map: unknown = null;

  dayMarkers: Array<unknown> = [];

  constructor(props: HikeProps) {
    makeAutoObservable(this);

    this.id = props.id;

    this.duration = props.duration;

    this.distance = props.distance;

    // if (props) {
    //   Object.keys(props).forEach((key) => {
    //     this[key] = props[key];
    //   });
    // }

    this.requestDetails();
  }

  async requestDetails(): Promise<void> {
    this.setRequesting(true);
    const response = await fetch(`/hike/${this.id}/details`);

    if (response.ok) {
      const details = await response.json();

      this.setDuration(details.duration);
      this.setDistance(details.distance);
      this.setRequesting(false);
    }
  }

  async requestHikerProfiles(): Promise<void> {
    const response = await fetch(`/hike/${this.id}/hiker-profile`);

    if (response.ok) {
      const profiles: Array<ProfileProps> = await response.json();
      this.setHikerProfiles(profiles.map((p) => new HikerProfile(p)));
    }
  }

  load(): void {
    this.map = new Map();
  }

  setHikerProfiles(profiles: Array<HikerProfile>): void {
    this.hikerProfiles = profiles;
  }

  addHikerProfile(profile: HikerProfile): void {
    this.hikerProfiles.push(profile);
  }

  async deleteHikerProfile(id: number): Promise<void> {
    const response = await httpDelete(`/hike/${this.id}/hiker-profile/${id}`);

    if (response.ok) {
      const deleted = await response.json();

      if (deleted) {
        const index = this.hikerProfiles.findIndex((p) => p.id === id);

        if (index !== -1) {
          this.setHikerProfiles([
            ...this.hikerProfiles.slice(0, index),
            ...this.hikerProfiles.slice(index + 1),
          ]);
        }
      }
    }

    // todo: handle the error case.
  }

  async requestSchedule(): Promise<void> {
    try {
      const response = await fetch(`/hike/${this.id}/schedule`);

      if (response.ok) {
        const schedule = await response.json();

        this.setSchedule(schedule);
        this.setDayMarkers(schedule);
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  setSchedule(schedule: Array<Days>): void {
    this.schedule = schedule;
  }

  setRequesting(requesting: boolean): void {
    this.requesting = requesting;
  }

  setDuration(duration: number): void {
    this.duration = duration;
  }

  setDistance(distance: number): void {
    this.distance = distance;
  }

  setDayMarkers(schedule: Array<Days>): void {
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
