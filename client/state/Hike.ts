import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import HikerProfile from './HikerProfile';
import Map from './Map';
import Route from './Route';
import {
  Day, DayProps, HikeInterface, HikeItemInterface, LatLng, MarkerTypes, PointOfInterestProps,
  ProfileProps,
} from './Types';
import { createIcon } from '../Hike/mapUtils';
import CampsiteMarker from './Markers/CampsiteMarker';
import Marker from './Markers/Marker';
import DayMarker from './Markers/DayMarker';

class Hike implements HikeInterface {
  id: number;

  name: string;

  duration: number | null = null;

  distance: number | null = null;

  requesting = false;

  hikerProfiles: HikerProfile[] = [];

  schedule: Day[] = [];

  route: Route = new Route(this);

  camps: CampsiteMarker[] = [];

  pointsOfInterest: Array<Marker> = [];

  map: Map;

  elevationMarkerIcon = createIcon('/red-circle.svg');

  elevationMarkerPos: LatLng | null = null;

  constructor(hikeItem: HikeItemInterface) {
    makeAutoObservable(this);

    this.map = new Map(this);

    this.id = hikeItem.id;

    this.name = hikeItem.name;

    this.route.requestRoute();

    this.requestPointsOfInterest();
  }

  async requestHikerProfiles(): Promise<void> {
    const response = await Http.get<ProfileProps[]>(`/api/hike/${this.id}/hiker-profile`);

    if (response.ok) {
      const profiles = await response.body();

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
    type AddHikerProfileRequest = {
      startTime: number | null,
      endTime: number | null,
      startDay: number | null,
      endDay: number | null,
    }

    const response = await Http.post<AddHikerProfileRequest, ProfileProps>(`/api/hike/${this.id}/hiker-profile`, {
      startTime: profile.startTime,
      endTime: profile.endTime,
      startDay: profile.startDay,
      endDay: profile.endDay,
    });

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        this.hikerProfiles.push(new HikerProfile(body, this));
      });
    }
  }

  async deleteHikerProfile(id: number): Promise<void> {
    type DeleteHikerProfileResponse = unknown;

    const response = await Http.delete<DeleteHikerProfileResponse>(`/api/hike/${this.id}/hiker-profile/${id}`);

    if (response.ok) {
      const deleted = await response.body();

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
      const response = await Http.get<DayProps[]>(`/api/hike/${this.id}/schedule`);

      if (response.ok) {
        const schedule = await response.body();

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
            };

            if (index > 0) {
              this.map.addMarker(new DayMarker(day, { lat: d.lat, lng: d.lng }));
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
    const response = await Http.get<PointOfInterestProps[]>(`/api/hike/${this.id}/poi`);

    if (response.ok) {
      const body = await response.body();

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
    const response = await Http.post(`/api/hike/${this.id}/poi`, {
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
