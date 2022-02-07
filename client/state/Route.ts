import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import L from 'leaflet';
import { metersToMiles, metersToFeet } from '../utilities';
import {
  Grade, HikeLegInterface, LatLng, MapInterface, MarkerType, RouteInterface, TrailPoint,
} from './Types';
import { RouteUpdateResponse, AnchorProps } from '../../common/ResponseTypes';
import Anchor, { resetWaypointLabel } from './PointsOfInterest/Anchor';

class Route implements RouteInterface {
  hikeLeg: HikeLegInterface;

  anchors: Anchor[] = [];

  grade: Grade = [[], [], [], [], []];

  elevations: [number, number, number, number][] = [];

  bounds: [L.LatLngTuple, L.LatLngTuple] | null = null;

  map: MapInterface;

  constructor(hikeLeg: HikeLegInterface, map: MapInterface) {
    this.map = map;
    this.hikeLeg = hikeLeg;

    makeAutoObservable(this);
  }

  clearWaypoints() {
    this.anchors.forEach((a) => {
      if (['start', 'finish', 'waypoint'].includes(a.marker.type)) {
        this.hikeLeg.map.removeMarker(a);
      }
    });
  }

  async requestRoute(): Promise<void> {
    try {
      const response = await Http.get<AnchorProps[]>(`/api/hike-leg/${this.hikeLeg.id}/route`);

      if (response.ok) {
        const route = await response.body();

        runInAction(() => {
          if (route) {
            const { map } = this.hikeLeg;

            if (map === null) {
              throw new Error('map is null');
            }

            this.clearWaypoints();

            resetWaypointLabel();
            if (route.length > 0) {
              const newRoute = route.map((a: AnchorProps, index) => {
                let type: MarkerType = 'waypoint';
                if (index === 0) {
                  type = 'start';
                }
                else if (index === route.length - 1) {
                  type = 'finish';
                }

                const anchor = new Anchor(type, a, this, this.map);

                if (a.type === 'waypoint') {
                  map.addMarker(anchor);
                }

                return anchor;
              });

              this.anchors = newRoute;
              this.setElevations(this.computeElevations());
              this.bounds = this.computeBounds();

              this.hikeLeg.requestSchedule();
            }
          }
        });
      }
    }
    catch (error) {
      console.log(error);
    }
    // todo: handle error case
  }

  updateRoute(updates: RouteUpdateResponse): void {
    this.receiveWaypointUpdates(updates);
    this.hikeLeg.requestSchedule();
  }

  async addStartWaypoint(position: LatLng): Promise<void> {
    this.map.setWaiting(true);

    const response = await Http.post<LatLng, RouteUpdateResponse>(`/api/hike-leg/${this.hikeLeg.id}/route/start-point`,
      position);

    if (response.ok) {
      const updates = await response.body();

      runInAction(() => {
        if (updates === null) {
          this.requestRoute();
        }
        else {
          this.updateRoute(updates);
        }

        this.map.setWaiting(false);
      });
    }
    else {
      this.map.setWaiting(false);
    }
  }

  async addEndWaypoint(position: LatLng): Promise<void> {
    try {
      this.map.setWaiting(true);

      const response = await Http.post<LatLng, RouteUpdateResponse>(`/api/hike-leg/${this.hikeLeg.id}/route/end-point`,
        position);

      if (response.ok) {
        const updates = await response.body();

        runInAction(() => {
          if (updates === null) {
            this.requestRoute();
          }
          else {
            this.updateRoute(updates);
          }

          this.map.setWaiting(false);
        });
      }
      else {
        this.map.setWaiting(false);
      }
    }
    catch (error) {
      this.map.setWaiting(false);
    }
  }

  async addWaypoint(position: LatLng): Promise<void> {
    this.map.setWaiting(true);

    const response = await Http.post<LatLng, RouteUpdateResponse>(`/api/hike-leg/${this.hikeLeg.id}/route/waypoint`,
      position);

    if (response.ok) {
      const updates = await response.body();

      runInAction(() => {
        if (updates === null) {
          this.requestRoute();
        }
        else {
          this.updateRoute(updates);
        }

        this.map.setWaiting(false);
      });
    }
    else {
      this.map.setWaiting(false);
    }
  }

  async moveWaypoint(id: number, point: LatLng): Promise<LatLng> {
    const response = await Http.put<LatLng, RouteUpdateResponse>(`/api/hike-leg/${this.hikeLeg.id}/route/waypoint/${id}/position`,
      point);

    if (response.ok) {
      const updates = await response.body();

      const waypoint = updates.anchors.find((a) => a.id === id);

      if (!waypoint) {
        throw new Error('waypoint not found');
      }

      runInAction(() => {
        if (updates) {
          this.updateRoute(updates);
        }
      });

      return { lat: waypoint.lat, lng: waypoint.lng };
    }

    return Promise.reject();
  }

  processUpdates(updates: AnchorProps[], anchors: Anchor[]): Anchor[] {
    return updates.map((u) => {
      // Is this update for an existing anchor?
      const a = anchors.find((a2) => a2.id === u.id);

      if (a) {
        a.update(u);
        return a;
      }

      const anchor = new Anchor('waypoint', u, this, this.map);

      if (u.type === 'waypoint') {
        this.hikeLeg.map.addMarker(anchor);
      }

      return anchor;
    });
  }

  receiveWaypointUpdates(updates: RouteUpdateResponse): void {
    if (this.anchors.length === 0) {
      this.anchors = this.processUpdates(updates.anchors, []);
      this.setElevations(this.computeElevations());
    }
    else {
      const firstIndex = this.anchors.findIndex((a) => a.id === updates.anchors[0].id);
      let lastIndex = this.anchors.findIndex(
        (a) => a.id === updates.anchors[updates.anchors.length - 1].id,
      );

      if (firstIndex === -1) {
        throw Error('update anchor index not found');
      }

      if (lastIndex === -1) {
        lastIndex = firstIndex;
      }

      let newRoute: Anchor[] = [];

      switch (updates.type) {
        case 'end':
          newRoute = [
            ...this.anchors.slice(0, firstIndex),
            ...this.processUpdates(
              updates.anchors, this.anchors.slice(firstIndex, lastIndex + 1),
            ),
          ];

          runInAction(() => {
            if (firstIndex !== 0) {
              // The list was added to. Mark what was the last anchor
              // as a regular waypoint.
              newRoute[firstIndex].marker.type = 'waypoint';
            }

            if (newRoute.length !== 1) {
              newRoute[newRoute.length - 1].marker.type = 'finish';
            }
          });
          break;

        case 'start':
          // There was only one anchor entry in the update and it
          // matched the second anchor. Therefore, this must be
          // the new last anchor in the route. Remove the beginning
          // of the route.
          newRoute = [
            ...this.processUpdates(updates.anchors, this.anchors),
            ...this.anchors.slice(lastIndex + 1),
          ];

          runInAction(() => {
            newRoute[0].marker.type = 'start';
          });
          break;

        case 'middle':
          newRoute = [
            ...this.anchors.slice(0, firstIndex),
            ...this.processUpdates(
              updates.anchors, this.anchors.slice(firstIndex, lastIndex + 1),
            ),
            ...this.anchors.slice(lastIndex + 1),
          ];
          break;

        default:
          throw new Error('invalid update type');
      }

      resetWaypointLabel();
      newRoute.forEach((a) => {
        a.setLabel();
      });

      this.anchors = newRoute;
      this.setElevations(this.computeElevations());
    }
  }

  computeBounds(): [L.LatLngTuple, L.LatLngTuple] {
    if (this.anchors.length > 0) {
      const result = this.anchors.reduce((accum, anc) => {
        if (anc.trail) {
          return accum.extend(anc.trail.reduce((a: L.LatLngBounds, point: TrailPoint) => (
            a.extend(point)
          ), L.latLngBounds([
            anc.marker.latLng,
            anc.marker.latLng,
          ])));
        }

        return accum;
      }, L.latLngBounds([
        this.anchors[0].marker.latLng,
        this.anchors[0].marker.latLng,
      ]));

      return [[result.getSouth(), result.getWest()], [result.getNorth(), result.getEast()]];
    }

    throw new Error('cannot compute bounds from empty array');
  }

  setElevations(elevations: [number, number, number, number][]): void {
    this.elevations = elevations;
  }

  computeElevations(): [number, number, number, number][] {
    let distance = 0;

    return (
      this.anchors
        .filter((a) => a.trail)
        .flatMap((a: Anchor) => {
          const elevations = a.trail
            .map((p: TrailPoint): [number, number, number, number] => ([
              metersToMiles(distance + p.dist),
              metersToFeet(p.ele !== undefined ? p.ele : 0),
              p.lat,
              p.lng,
            ]));

          distance += a.trailLength;

          return elevations;
        })
    );
  }

  static metersPerHourGet(dh: number, dx: number): number {
    // This formula was defined by Tobler
    // On flat ground the formula works out to about 5 km/h.
    return 6 * 2.71828 ** (-3.5 * Math.abs(dh / dx + 0.05)) * 1000;
  }

  findSteepestPoint(): unknown {
    let slowestRate: number | null = null;
    let steepestPoint = null;

    this.anchors.forEach((a) => {
      if (a.trail) {
        let prevPoint: TrailPoint | null = null;
        a.trail.forEach((t: TrailPoint, index: number) => {
          if (index > 0) {
            if (prevPoint === null) {
              throw new Error('prevPoint is null');
            }

            const metersPerHour = Route.metersPerHourGet(
              t.ele - prevPoint.ele, t.dist - prevPoint.dist,
            );

            if (slowestRate === null || metersPerHour < slowestRate) {
              slowestRate = metersPerHour;
              steepestPoint = prevPoint;
            }
          }

          prevPoint = t;
        });
      }
    });

    console.log(`rate: ${slowestRate}`);
    return steepestPoint;
  }

  generateGradeSegments(): void {
    const grade: Grade = [[], [], [], [], []];
    let current: null | number = null;
    const gradeValues: number[] = [1609 * 1, 1609 * 2, 1609 * 3, 1609 * 4, 1609 * 10];

    this.anchors.forEach((a) => {
      if (a.trail) {
        let prevPoint: TrailPoint | null = null;

        a.trail.forEach((t: TrailPoint) => {
          if (prevPoint !== null) {
            const metersPerHour = Route.metersPerHourGet(
              t.ele - prevPoint.ele, t.dist - prevPoint.dist,
            );

            // eslint-disable-next-line no-restricted-syntax
            for (let g = 0; g < gradeValues.length; g += 1) {
              if (metersPerHour < gradeValues[g]) {
                if (current !== g) {
                  current = g;
                  grade[current].push([new L.LatLng(prevPoint.lat, prevPoint.lng)]);
                }

                grade[current][grade[current].length - 1].push(new L.LatLng(t.lat, t.lng));

                break;
              }
            }
          }

          prevPoint = t;
        });
      }
    });

    runInAction(() => {
      this.grade = grade;
    });
  }
}

export default Route;
