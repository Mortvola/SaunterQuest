import { makeAutoObservable, runInAction } from 'mobx';
import L from 'leaflet';
import HikerProfile from './HikerProfile';
import Map from './Map';
import TrailMarker from './TrailMarker';
import Route from './Route';
import { httpDelete } from './Transports';
import {
  Day, DayProps, HikeInterface, HikeItemInterface, LatLng,
} from './Types';
import { createIcon } from '../Hike/mapUtils';
import CampsiteMarker from './Markers/CampsiteMarker';
import DayMarker from './Markers/DayMarker';

interface ProfileProps {
  id: number;
}

const dayMarkerUrl = 'moon.svg';

class Hike implements HikeInterface {
  id: number;

  name: string;

  duration: number | null = null;

  distance: number | null = null;

  requesting = false;

  hikerProfiles: Array<HikerProfile> = [];

  schedule: Array<Day> = [];

  route = new Route(this);

  camps: Array<CampsiteMarker> = [];

  map = new Map();

  elevationMarkerIcon = createIcon('https://maps.google.com/mapfiles/ms/micons/red.png');

  elevationMarkerPos: LatLng | null = null;

  constructor(hikeItem: HikeItemInterface) {
    makeAutoObservable(this);

    this.id = hikeItem.id;

    this.name = hikeItem.name;
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
          let meters = 0;

          this.schedule = schedule.map((d, index) => {
            const day: Day = {
              id: d.id,
              day: index,
              latLng: { lat: d.lat, lng: d.lng },
              endLatLng: { lat: d.endLat, lng: d.endLng },
              ele: d.ele,
              startMeters: meters,
              meters: d.meters,
              startTime: d.startTime,
              endTime: d.endTime,
              gain: d.gain,
              loss: d.loss,
              accumWeight: 0,
              marker: new TrailMarker(dayMarkerUrl),
            };

            if (index > 0) {
              this.map.addMarker(new DayMarker({ lat: d.lat, lng: d.lng }));
            }

            meters += d.meters;

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

  setElevationMarker(latLng: LatLng | null): void {
    runInAction(() => {
      this.elevationMarkerPos = latLng;
    });
  }

  addCamp(latLng: LatLng): void {
    const campsite = new CampsiteMarker(latLng);
    this.camps.push(campsite);
    this.map.addMarker(campsite);
  }
}

export default Hike;
