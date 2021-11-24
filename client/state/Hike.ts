import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import HikerProfile from './HikerProfile';
import Map from './Map';
import Route from './Route';
import {
  Day, DayProps, HikeInterface, LatLng, MarkerAttributeTypes,
  PointOfInterestProps, ProfileProps,
} from './Types';
import { createIcon } from '../Hike/mapUtils';
import CampsiteMarker from './Markers/CampsiteAttribute';
import MarkerAttribute from './Markers/MarkerAttribute';
import DayAttribute from './Markers/DayAttribute';
import { redCircle } from '../Hike/Map/Icons';
import { HikeProps } from '../../common/ResponseTypes';

class Hike implements HikeInterface {
  id: number;

  name: string;

  duration: number | null = null;

  distance: number | null = null;

  routeGroupId: number | null = null;

  requesting = false;

  hikerProfiles: HikerProfile[] = [];

  schedule: Day[] = [];

  route: Route;

  camps: CampsiteMarker[] = [];

  pointsOfInterest: MarkerAttribute[] = [];

  map: Map;

  elevationMarkerIcon = createIcon(redCircle);

  elevationMarkerPos: LatLng | null = null;

  constructor(hikeItem: HikeProps) {
    makeAutoObservable(this);

    this.map = new Map(this);
    this.route = new Route(this, this.map);

    this.id = hikeItem.id;

    this.name = hikeItem.name;

    this.routeGroupId = hikeItem.routeGroupId;

    this.route.requestRoute();

    this.requestPointsOfInterest();
  }

  async updateSettings(name: string, routeGroupId: number | null): Promise<void> {
    const response = await Http.patch(`/api/hike/${this.id}`, { name, routeGroupId });

    if (response.ok) {
      this.name = name;
      this.routeGroupId = routeGroupId;
    }
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

          // Remove the current day attributes
          this.schedule.forEach((d) => {
            if (d.dayAttribute) {
              d.dayAttribute.remove();
            }
          });

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

            day.dayAttribute = new DayAttribute(day, { lat: d.lat, lng: d.lng });

            if (index > 0) {
              this.map.addMarkerAttribute(day.dayAttribute);
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
        body.forEach((poi) => this.map.addMarkerAttribute(new MarkerAttribute(
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
    this.map.addMarkerAttribute(campsite);
  }

  private async addPOI(latLng: LatLng, type: MarkerAttributeTypes): Promise<void> {
    const response = await Http.post(`/api/hike/${this.id}/poi`, {
      name: null,
      description: null,
      lat: latLng.lat,
      lng: latLng.lng,
      type,
    });

    if (response.ok) {
      const poi = new MarkerAttribute(type, latLng, true);
      this.map.addMarkerAttribute(poi);
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
