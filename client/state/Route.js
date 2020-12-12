import { makeAutoObservable } from 'mobx';
import L from 'leaflet';
import Anchor, { resetWaypointLabel } from './Anchor';
import { metersToMiles, metersToFeet } from '../utilities';

class Route {
  constructor(hike) {
    this.hike = hike;
    this.anchors = [];
    this.elevations = [];
    this.bounds = null;

    makeAutoObservable(this);
  }

  async requestRoute() {
    try {
      const route = await fetch(`/hike/${this.hike.id}/route`)
        .then(async (response) => {
          if (response.ok) {
            return response.json();
          }

          return null;
        });

      if (route) {
        this.receiveRoute(route);
        this.hike.requestSchedule();
      }
    }
    catch (error) {
      console.log(error);
    }
    // todo: handle error case
  }

  receiveRoute(route) {
    resetWaypointLabel();
    const newRoute = route.map((a) => new Anchor(a));

    this.setRoute(newRoute);
    this.setElevations(this.computeElevations());
    this.setBounds(this.computeBounds());
  }

  async addStartWaypoint(position) {
    const updates = await fetch(`/hike/${this.hike.id}/route/start-point`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ lat: position.lat, lng: position.lng }),
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (updates === null) {
      this.requestRoute();
    }
    else {
      this.receiveWaypointUpdates(updates);
      this.hike.requestSchedule();
    }
  }

  async addEndWaypoint(position) {
    const updates = await fetch(`/hike/${this.hike.id}/route/end-point`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ lat: position.lat, lng: position.lng }),
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (updates === null) {
      this.requestRoute();
    }
    else {
      this.receiveWaypointUpdates(updates);
      this.hike.requestSchedule();
    }
  }

  async addWaypoint(position) {
    const updates = await fetch(`/hike/${this.hike.id}/route/waypoint`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ lat: position.lat, lng: position.lng }),
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (updates === null) {
      this.requestRoute();
    }
    else {
      this.receiveWaypointUpdates(updates);
      this.hike.requestSchedule();
    }
  }

  async moveWaypoint(id, point) {
    const updates = await fetch(`/hike/${this.hike.id}/route/waypoint/${id}/position`, {
      method: 'PUT',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ ...point }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (updates) {
      this.receiveWaypointUpdates(updates);
      this.hike.requestSchedule();
    }
  }

  async deleteWaypoint(id) {
    const updates = await fetch(`/hike/${this.hike.id}/route/waypoint/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (updates) {
      this.receiveWaypointUpdates(updates);
      this.hike.requestSchedule();
    }
  }

  static processUpdates(updates, anchors) {
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

  receiveWaypointUpdates(updates) {
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

  setRoute(route) {
    this.anchors = route;
  }

  setBounds(bounds) {
    if (bounds) {
      this.bounds = [bounds.getSouthWest(), bounds.getNorthEast()];
    }
    else {
      this.bounds = null;
    }
  }

  computeBounds() {
    if (this.anchors.length > 0) {
      return this.anchors.reduce((accum, anc) => {
        if (anc.trail) {
          return accum.extend(anc.trail.reduce((a, point) => (
            a.extend(point)
          ), L.latLngBounds(anc)));
        }

        return accum;
      }, L.latLngBounds(this.anchors[0]));
    }

    return null;
  }

  setElevations(elevations) {
    this.elevations = elevations;
  }

  computeElevations() {
    let distance = 0;

    return (
      this.anchors
        .filter((a) => a.trail)
        .flatMap((a) => {
          const elevations = a.trail
            .map((p) => ([
              metersToMiles(distance + p.dist),
              metersToFeet(p.ele !== undefined ? p.ele : 0),
            ]));

          distance += a.trailLength;

          return elevations;
        })
    );
  }

  static metersPerHourGet(dh, dx) {
    // This formula was defined by Tobler
    // On flat ground the formula works out to about 5 km/h.
    return 6 * 2.71828 ** (-3.5 * Math.abs(dh / dx + 0.05)) * 1000;
  }

  findSteepestPoint() {
    let slowestRate = null;
    let steepestPoint = null;

    this.anchors.forEach((a) => {
      if (a.trail) {
        let prevPoint = null;
        a.trail.forEach((t, index) => {
          if (index > 0) {
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
