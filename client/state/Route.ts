import { makeAutoObservable, runInAction } from 'mobx';
import L from 'leaflet';
import Http from '@mortvola/http';
import Anchor, { resetWaypointLabel } from './Markers/Anchor';
import { metersToMiles, metersToFeet } from '../utilities';
import {
  AnchorProps, HikeInterface, LatLng, RouteInterface, TrailPoint,
} from './Types';

class Route implements RouteInterface {
  hike: HikeInterface;

  anchors: Anchor[] = [];

  elevations: Array<[number, number, number, number]> = [];

  bounds: [L.LatLngTuple, L.LatLngTuple] | null = null;

  constructor(hike: HikeInterface) {
    this.hike = hike;

    makeAutoObservable(this);
  }

  async requestRoute(): Promise<void> {
    try {
      const response = await Http.get<AnchorProps[]>(`/api/hike/${this.hike.id}/route`);

      if (response.ok) {
        const route = await response.body();

        runInAction(() => {
          if (route) {
            const { map } = this.hike;

            if (map === null) {
              throw new Error('map is null');
            }

            resetWaypointLabel();
            if (route.length > 0) {
              const newRoute = route.map((a: AnchorProps) => {
                const anchor = new Anchor(a, this);

                if (a.type === 'waypoint') {
                  map.addMarker(anchor);
                }

                return anchor;
              });

              this.anchors = newRoute;
              this.setElevations(this.computeElevations());
              this.bounds = this.computeBounds();

              this.hike.requestSchedule();
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

  updateRoute(updates: AnchorProps[]): void {
    this.receiveWaypointUpdates(updates);
    this.hike.requestSchedule();
  }

  async addStartWaypoint(position: LatLng): Promise<void> {
    const response = await Http.post<LatLng, AnchorProps[]>(`/api/hike/${this.hike.id}/route/start-point`,
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
      });
    }
  }

  async addEndWaypoint(position: LatLng): Promise<void> {
    const response = await Http.post<LatLng, AnchorProps[]>(`/api/hike/${this.hike.id}/route/end-point`,
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
      });
    }
  }

  addWaypoint = async (position: LatLng): Promise<void> => {
    const response = await Http.post<LatLng, AnchorProps[]>(`/api/hike/${this.hike.id}/route/waypoint`,
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
      });
    }
  }

  moveWaypoint = async (id: number, point: LatLng): Promise<LatLng> => {
    const response = await Http.put<LatLng, AnchorProps[]>(`/api/hike/${this.hike.id}/route/waypoint/${id}/position`,
      point);

    if (response.ok) {
      const updates = await response.body();

      const waypoint = updates.find((a) => a.id === id);

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

  async deleteWaypoint(id: number): Promise<void> {
    const response = await Http.delete<AnchorProps[]>(`/api/hike/${this.hike.id}/route/waypoint/${id}`);

    if (response.ok) {
      const updates = await response.body();

      runInAction(() => {
        if (updates) {
          this.updateRoute(updates);
        }
      });
    }
  }

  processUpdates = (updates: Array<AnchorProps>, anchors: Array<Anchor>): Array<Anchor> => (
    updates.map((u) => {
      // Is this update for an existing anchor?
      const a = anchors.find((a2) => a2.id === u.id);

      if (a) {
        a.update(u);
        return a;
      }

      const anchor = new Anchor(u, this);

      if (u.type === 'waypoint') {
        this.hike.map.addMarker(anchor);
      }

      return anchor;
    })
  )

  receiveWaypointUpdates(updates: Array<AnchorProps>): void {
    if (this.anchors.length === 0) {
      this.anchors = this.processUpdates(updates, []);
      this.setElevations(this.computeElevations());
    }
    else {
      const firstIndex = this.anchors.findIndex((a) => a.id === updates[0].id);
      let lastIndex = this.anchors.findIndex(
        (a) => a.id === updates[updates.length - 1].id,
      );

      if (firstIndex !== -1) {
        if (lastIndex === -1) {
          lastIndex = firstIndex;
        }
        const newRoute = [
          ...this.anchors.slice(0, firstIndex),
          ...this.processUpdates(updates, this.anchors.slice(firstIndex, lastIndex + 1)),
          ...this.anchors.slice(lastIndex + 1),
        ];

        resetWaypointLabel();
        newRoute.forEach((a) => {
          a.setLabel();
        });

        this.anchors = newRoute;
        this.setElevations(this.computeElevations());
      }
    }
  }

  computeBounds(): [L.LatLngTuple, L.LatLngTuple] {
    if (this.anchors.length > 0) {
      const result = this.anchors.reduce((accum, anc) => {
        if (anc.trail) {
          return accum.extend(anc.trail.reduce((a: L.LatLngBounds, point: TrailPoint) => (
            a.extend(point)
          ), L.latLngBounds([
            anc.latLng,
            anc.latLng,
          ])));
        }

        return accum;
      }, L.latLngBounds([
        this.anchors[0].latLng,
        this.anchors[0].latLng,
      ]));

      return [[result.getSouth(), result.getWest()], [result.getNorth(), result.getEast()]];
    }

    throw new Error('cannot compute bounds from empty array');
  }

  setElevations(elevations: Array<[number, number, number, number]>): void {
    this.elevations = elevations;
  }

  computeElevations(): Array<[number, number, number, number]> {
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
}

export default Route;
