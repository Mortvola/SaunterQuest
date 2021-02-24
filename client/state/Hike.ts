import { makeAutoObservable, runInAction } from 'mobx';
import HikerProfile from './HikerProfile';
import Map from './Map';
import TrailMarker from './TrailMarker';
import Route from './Route';
import { metersToMiles } from '../utilities';
import { httpDelete } from './Transports';
import {
  BaseHikeProps, Day, DayProps, HikeInterface,
} from './Types';

interface ProfileProps {
  id: number;
}

const dayMarkerUrl = 'moon_pin.png';

class Hike implements HikeInterface {
  id: number | null;

  name: string;

  duration: number | null = null;

  distance: number | null = null;

  requesting = false;

  hikerProfiles: Array<HikerProfile> = [];

  schedule: Array<Day> = [];

  route = new Route(this);

  map: Map | null = null;

  constructor(props: BaseHikeProps) {
    makeAutoObservable(this);

    this.id = props.id;

    this.name = props.name;

    this.requestDetails();
  }

  async requestDetails(): Promise<void> {
    this.setRequesting(true);
    const response = await fetch(`/hike/${this.id}/details`);

    if (response.ok) {
      const details = await response.json();

      runInAction(() => {
        this.setDuration(details.duration);
        this.setDistance(details.distance);
        this.setRequesting(false);
      });
    }
  }

  async requestHikerProfiles(): Promise<void> {
    const response = await fetch(`/hike/${this.id}/hiker-profile`);

    if (response.ok) {
      const profiles: Array<ProfileProps> = await response.json();

      runInAction(() => {
        this.setHikerProfiles(profiles.map((p) => new HikerProfile(p)));
      });
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

      runInAction(() => {
        if (deleted) {
          const index = this.hikerProfiles.findIndex((p) => p.id === id);

          if (index !== -1) {
            this.setHikerProfiles([
              ...this.hikerProfiles.slice(0, index),
              ...this.hikerProfiles.slice(index + 1),
            ]);
          }
        }
      });
    }

    // todo: handle the error case.
  }

  async requestSchedule(): Promise<void> {
    try {
      const response = await fetch(`/hike/${this.id}/schedule`);

      if (response.ok) {
        const schedule: Array<DayProps> = await response.json();

        runInAction(() => {
          let miles = 0;

          this.schedule = schedule.map((d, index) => {
            const day: Day = {
              id: d.id,
              day: index,
              startMile: miles,
              latLng: { lat: d.lat, lng: d.lng },
              endLatLng: { lat: d.endLat, lng: d.endLng },
              ele: d.ele,
              startMeters: d.startTime,
              meters: d.meters,
              startTime: d.startTime,
              endTime: d.endTime,
              gain: d.gain,
              loss: d.loss,
              accumWeight: 0,
              marker: new TrailMarker(dayMarkerUrl),
            };

            miles += metersToMiles(d.meters);

            return day;
          });
        });
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  setSchedule(schedule: Array<Day>): void {
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
}

export default Hike;
