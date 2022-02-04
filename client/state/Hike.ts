import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import L from 'leaflet';
import HikerProfile from './HikerProfile';
import Map from './Map';
import Route from './Route';
import {
  Day, DayProps, HikeInterface, MarkerType,
  PointOfInterestProps, ProfileProps,
} from './Types';
import { createIcon } from '../Hike/mapUtils';
import { redCircle } from './PointsOfInterest/Icons';
import { HikeProps } from '../../common/ResponseTypes';
import Marker from './Marker';
import DayPoi from './PointsOfInterest/Day';

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

  camps: Marker[] = [];

  pointsOfInterest: Marker[] = [];

  map: Map;

  elevationMarkerIcon = createIcon(redCircle);

  elevationMarkerPos: L.LatLng | null = null;

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
      metersPerHour: number | null,
      startTime: number | null,
      endTime: number | null,
      startDay: number | null,
      endDay: number | null,
    }

    const response = await Http.post<AddHikerProfileRequest, ProfileProps>(`/api/hike/${this.id}/hiker-profile`, {
      metersPerHour: profile.metersPerHour,
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
      runInAction(() => {
        const index = this.hikerProfiles.findIndex((p) => p.id === id);

        if (index !== -1) {
          this.hikerProfiles = [
            ...this.hikerProfiles.slice(0, index),
            ...this.hikerProfiles.slice(index + 1),
          ];
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

          // Remove the current day markers
          this.schedule.forEach((d) => {
            if (d.endOfDayPOI) {
              d.endOfDayPOI.marker.remove();
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

            if (index > 0) {
              day.endOfDayPOI = new DayPoi(
                d.id, `End of Day ${index}`, new L.LatLng(d.lat, d.lng), this.map,
              );
              this.map.addMarker(day.endOfDayPOI);
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
    // const response = await Http.get<PointOfInterestProps[]>(`/api/hike/${this.id}/poi`);

    // if (response.ok) {
    //   const body = await response.body();

    //   runInAction(() => {
    //     body.forEach((poi) => this.map.addMarker(new Marker(
    //       poi.type,
    //       { lat: poi.lat, lng: poi.lng },
    //       true,
    //       false,
    //       this.map,
    //     )));
    //   });
    // }
  }

  setSchedule(schedule: Day[]): void {
    this.schedule = schedule;
  }

  setElevationMarker(latLng: L.LatLng | null): void {
    runInAction(() => {
      this.elevationMarkerPos = latLng;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addCamp(latLng: L.LatLng): void {
    // const campsite = new Marker('campsite', latLng, true, true, this.map);
    // this.camps.push(campsite);
    // this.map.addMarker(campsite);
  }

  // eslint-disable-next-line class-methods-use-this
  private async addPOI(latLng: L.LatLng, type: MarkerType): Promise<void> {
    // const response = await Http.post(`/api/hike/${this.id}/poi`, {
    //   name: null,
    //   description: null,
    //   lat: latLng.lat,
    //   lng: latLng.lng,
    //   type,
    // });

    // if (response.ok) {
    //   const poi = new Marker(type, latLng, true, false, this.map);
    //   this.map.addMarker(poi);
    // }
  }

  addWater = async (latLng: L.LatLng): Promise<void> => {
    this.addPOI(latLng, 'water');
  }

  addResupply = async (latLng: L.LatLng): Promise<void> => {
    this.addPOI(latLng, 'resupply');
  }
}

export default Hike;
