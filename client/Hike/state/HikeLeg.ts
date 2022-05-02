import Http from '@mortvola/http';
import { makeAutoObservable, runInAction } from 'mobx';
import L from 'leaflet';
import { DayProps, HikeLegProps } from '../../../common/ResponseTypes';
import HikerProfile from './HikerProfile';
import Map from './Map';
import Route from './Route';
import { HikeLegInterface, ProfileProps, Day } from './Types';
import DayPoi from './PointsOfInterest/Day';
import { DateTime } from 'luxon';

class HikeLeg implements HikeLegInterface {
  id: number;

  name: string | null;

  startDate: DateTime | null;

  numberOfDays: number = 0;

  color: string;

  map: Map;

  route: Route;

  schedule: Day[] = [];

  hikerProfiles: HikerProfile[] = [];

  elevationMarkerPos: L.LatLng | null = null;

  constructor(props: HikeLegProps, map: Map) {
    this.id = props.id;
    this.name = props.name;
    this.startDate = props.startDate === null ? null : DateTime.fromISO(props.startDate);
    this.numberOfDays = props.schedule?.numberOfDays ?? 0;
    this.color = props.color;

    this.map = map;
    this.route = new Route(this, map);

    makeAutoObservable(this);
  }

  load(hikerProfiles = false): void {
    this.route.requestRoute();
    if (hikerProfiles) {
      this.requestHikerProfiles();
    }
  }

  clearDayMarkers() {
    this.schedule.forEach((d) => {
      if (d.endOfDayPOI) {
        d.endOfDayPOI.marker.remove();
      }
    });
  }

  unload() {
    this.clearDayMarkers();
    this.route.clearWaypoints();
  }

  async requestSchedule(): Promise<void> {
    try {
      const response = await Http.get<DayProps[]>(`/api/hike-leg/${this.id}/schedule`);

      if (response.ok) {
        const schedule = await response.body();

        runInAction(() => {
          let meters = 0;

          this.clearDayMarkers();

          this.schedule = schedule.map((d, index) => {
            const day: Day = {
              id: d.id,
              day: index,
              latLng: { lat: d.lat, lng: d.lng },
              endLatLng: { lat: d.endLat, lng: d.endLng },
              ele: d.ele,
              startMeters: meters,
              meters: d.meters,
              startTime: d.startTime ?? 0,
              endTime: d.endTime ?? 0,
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

  async update(name: string, startDate: string | null, color: string): Promise<void> {
    const response = await Http.patch(`/api/hike-leg/${this.id}`, {
      name,
      startDate,
      color,
    })

    if (response.ok) {
      runInAction(() => {
        this.name = name;
        this.startDate = startDate === null ? null : DateTime.fromISO(startDate);
        this.color = color;
      })  
    }
  }

  setSchedule(schedule: Day[]): void {
    this.schedule = schedule;
  }

  async requestHikerProfiles(): Promise<void> {
    const response = await Http.get<ProfileProps[]>(`/api/hike-leg/${this.id}/hiker-profile`);

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

    const response = await Http.post<AddHikerProfileRequest, ProfileProps>(`/api/hike-leg/${this.id}/hiker-profile`, {
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
  };

  async deleteHikerProfile(id: number): Promise<void> {
    type DeleteHikerProfileResponse = unknown;

    const response = await Http.delete<DeleteHikerProfileResponse>(`/api/hike-leg/${this.id}/hiker-profile/${id}`);

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

  setElevationMarker(latLng: L.LatLng | null): void {
    runInAction(() => {
      this.elevationMarkerPos = latLng;
    });
  }

  async requestRouteGroup(): Promise<L.LatLng[][] | null> {
    const response = await Http.get<[number, number][][]>(`/api/hike-leg/${this.id}/route-group`);

    if (response.ok) {
      const body = await response.body();

      return body.map((t) => t.map((t2) => new L.LatLng(t2[0], t2[1])));
    }

    return null;
  }
}

export default HikeLeg;
