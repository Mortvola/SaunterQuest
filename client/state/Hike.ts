import { makeAutoObservable, runInAction } from 'mobx';
import HikerProfile from './HikerProfile';
import Map from './Map';
import TrailMarker from './TrailMarker';
import Route from './Route';
import { httpDelete, postJSON } from './Transports';
import {
  Day, DayProps, HikeInterface, HikeItemInterface, LatLng, MarkerTypes, PointOfInterestProps,
  ProfileProps,
} from './Types';
import { createIcon } from '../Hike/mapUtils';
import CampsiteMarker from './Markers/CampsiteMarker';
import Marker from './Markers/Marker';
import DayMarker from './Markers/DayMarker';

const dayMarkerUrl = '/moon.svg';

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

  pointsOfInterest: Array<Marker> = [];

  map = new Map();

  elevationMarkerIcon = createIcon('/red-circle.svg');

  elevationMarkerPos: LatLng | null = null;

  constructor(hikeItem: HikeItemInterface) {
    makeAutoObservable(this);

    this.id = hikeItem.id;

    this.name = hikeItem.name;

    this.route.requestRoute();

    this.requestPointsOfInterest();
  }

  async requestHikerProfiles(): Promise<void> {
    const response = await fetch(`/hike/${this.id}/hiker-profile`);

    if (response.ok) {
      const profiles: Array<ProfileProps> = await response.json();

      runInAction(() => {
        this.hikerProfiles = profiles.map((p) => new HikerProfile(p, this));

        this.hikerProfiles.sort((a, b) => {
          if (a.startDay === null) {
            if (b.startDay === null) {
              if (a.endDay === null) {
                if (b.endDay === null) {
                  return 0;
                }

                return 0;
              }

              if (b.endDay === null) {
                return 0;
              }

              return a.endDay - b.endDay;
            }

            return 0;
          }

          if (b.startDay === null) {
            return 0;
          }

          return a.startDay - b.startDay;
        });
      });
    }
  }

  addHikerProfile = async (profile: ProfileProps): Promise<void> => {
    const response = await postJSON(`/hike/${this.id}/hiker-profile`, {
      startTime: profile.startTime,
      endTime: profile.endTime,
      startDay: profile.startDay,
      endDay: profile.endDay,
    });

    if (response.ok) {
      const body: ProfileProps = await response.json();

      runInAction(() => {
        this.hikerProfiles.push(new HikerProfile(body, this));
      });
    }
  }

  async deleteHikerProfile(id: number): Promise<void> {
    const response = await httpDelete(`/hike/${this.id}/hiker-profile/${id}`);

    if (response.ok) {
      const deleted = await response.json();

      runInAction(() => {
        if (deleted) {
          const index = this.hikerProfiles.findIndex((p) => p.id === id);

          if (index !== -1) {
            this.hikerProfiles = [
              ...this.hikerProfiles.slice(0, index),
              ...this.hikerProfiles.slice(index + 1),
            ];
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

  requestPointsOfInterest = async (): Promise<void> => {
    const response = await fetch(`/hike/${this.id}/poi`);

    if (response.ok) {
      const body: Array<PointOfInterestProps> = await response.json();

      runInAction(() => {
        body.forEach((poi) => this.map.addMarker(new Marker(
          poi.type,
          { lat: poi.lat, lng: poi.lng },
          true,
        )));
      });
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

  private addPOI = async (latLng: LatLng, type: MarkerTypes): Promise<void> => {
    const response = await postJSON(`/hike/${this.id}/poi`, {
      name: null,
      description: null,
      lat: latLng.lat,
      lng: latLng.lng,
      type,
    });

    if (response.ok) {
      const poi = new Marker(type, latLng, true);
      this.map.addMarker(poi);
    }
  }

  addWater = async (latLng: LatLng): Promise<void> => {
    this.addPOI(latLng, 'water');
  }

  addResupply = async (latLng: LatLng): Promise<void> => {
    this.addPOI(latLng, 'resupply');
  }
}

export default Hike;
