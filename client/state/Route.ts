import { makeAutoObservable } from 'mobx';
import L, { LatLngBounds } from 'leaflet';
import Anchor, { resetWaypointLabel } from './Anchor';
import { metersToMiles, metersToFeet } from '../utilities';
import { httpDelete, postJSON, putJSON } from './Transports';
import {
  AnchorProps, HikeInterface, LatLng, TrailPoint,
} from './Types';

class Route {
  hike: HikeInterface;

  anchors: Array<Anchor> = [];

  elevations: Array<Array<number>> = [];

  bounds: unknown = null;

  constructor(hike: HikeInterface) {
    this.hike = hike;

    makeAutoObservable(this);
  }

  async requestRoute(): Promise<void> {
    try {
      const response = await fetch(`/hike/${this.hike.id}/route`);

      if (response.ok) {
        const route = await response.json();

        if (route) {
          this.receiveRoute(route);
          this.hike.requestSchedule();
        }
      }
    }
    catch (error) {
      console.log(error);
    }
    // todo: handle error case
  }

  receiveRoute(route: Array<AnchorProps>): void {
    resetWaypointLabel();
    const newRoute = route.map((a) => new Anchor(a));

    this.setRoute(newRoute);
    this.setElevations(this.computeElevations());
    this.setBounds(this.computeBounds());
  }

  async addStartWaypoint(position: LatLng): Promise<void> {
    const response = await postJSON(`/hike/${this.hike.id}/route/start-point`,
      position);

    if (response.ok) {
      const updates = await response.json();

      if (updates === null) {
        this.requestRoute();
      }
      else {
        this.receiveWaypointUpdates(updates);
        this.hike.requestSchedule();
      }
    }
  }

  async addEndWaypoint(position: LatLng): Promise<void> {
    const response = await postJSON(`/hike/${this.hike.id}/route/end-point`,
      position);

    if (response.ok) {
      const updates = await response.json();

      if (updates === null) {
        this.requestRoute();
      }
      else {
        this.receiveWaypointUpdates(updates);
        this.hike.requestSchedule();
      }
    }
  }

  async addWaypoint(position: LatLng): Promise<void> {
    const response = await postJSON(`/hike/${this.hike.id}/route/waypoint`,
      position);

    if (response.ok) {
      const updates = await response.json();

      if (updates === null) {
        this.requestRoute();
      }
      else {
        this.receiveWaypointUpdates(updates);
        this.hike.requestSchedule();
      }
    }
  }

  async moveWaypoint(id: number, point: unknown): Promise<void> {
    const response = await putJSON(`/hike/${this.hike.id}/route/waypoint/${id}/position`,
      point);

    if (response.ok) {
      const updates = await response.json();

      if (updates) {
        this.receiveWaypointUpdates(updates);
        this.hike.requestSchedule();
      }
    }
  }

  async deleteWaypoint(id: number): Promise<void> {
    const response = await httpDelete(`/hike/${this.hike.id}/route/waypoint/${id}`);

    if (response.ok) {
      const updates = await response.json();

      if (updates) {
        this.receiveWaypointUpdates(updates);
        this.hike.requestSchedule();
      }
    }
  }

  static processUpdates(updates: Array<AnchorProps>, anchors: Array<Anchor>): Array<Anchor> {
    return updates.map((u) => {
      // Is this update for an existing anchor?
      const a = anchors.find((a2) => a2.id === u.id);

      if (a) {
        a.update(u);
        return a;
      }

      return new Anchor(u);
    });
  }

  receiveWaypointUpdates(updates: Array<AnchorProps>): void {
    if (this.anchors.length === 0) {
      this.setRoute(Route.processUpdates(updates, []));
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
          ...Route.processUpdates(updates, this.anchors.slice(firstIndex, lastIndex + 1)),
          ...this.anchors.slice(lastIndex + 1),
        ];

        resetWaypointLabel();
        newRoute.forEach((a) => {
          a.setLabel();
        });

        this.setRoute(newRoute);
        this.setElevations(this.computeElevations());
      }
    }
  }

  setRoute(route: Array<Anchor>): void {
    this.anchors = route;
  }

  setBounds(bounds: LatLngBounds): void {
    if (bounds) {
      this.bounds = [bounds.getSouthWest(), bounds.getNorthEast()];
    }
    else {
      this.bounds = null;
    }
  }

  computeBounds(): LatLngBounds {
    if (this.anchors.length > 0) {
      return this.anchors.reduce((accum, anc) => {
        if (anc.trail) {
          return accum.extend(anc.trail.reduce((a: LatLngBounds, point: TrailPoint) => (
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
    }

    throw new Error('cannot compute bounds from empty array');
  }

  setElevations(elevations: Array<Array<number>>): void {
    this.elevations = elevations;
  }

  computeElevations(): Array<Array<number>> {
    let distance = 0;

    return (
      this.anchors
        .filter((a) => a.trail)
        .flatMap((a) => {
          const elevations = a.trail
            .map((p: TrailPoint) => ([
              metersToMiles(distance + p.dist),
              metersToFeet(p.ele !== undefined ? p.ele : 0),
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
