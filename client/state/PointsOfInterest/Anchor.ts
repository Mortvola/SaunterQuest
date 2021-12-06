import { makeObservable, observable, runInAction } from 'mobx';
import L from 'leaflet';
import Http from '@mortvola/http';
import TrailMarker from '../TrailMarker';
import {
  LatLng, MapInterface, MarkerType, RouteInterface,
  TrailPoint, PointOfInterestInterface,
} from '../Types';
import { AnchorProps, RouteUpdateResponse } from '../../../common/ResponseTypes';
import PointOfInterest from './PointOfInterset';

const wayPointUrl = 'compass.svg';

let waypointLabel = 'A';
let repeat = 1;

const resetWaypointLabel = (): void => {
  waypointLabel = 'A';
  repeat = 1;
};

const getWaypointLabel = () => {
  const newLabel = waypointLabel.repeat(repeat);

  // Get the next label. If the current label is Z then
  // start uing lower case letters.
  // TODO: Should switch to using two letters but wider icons will be needed.
  if (waypointLabel === 'Z') {
    waypointLabel = 'a';
  }
  else if (waypointLabel === 'z') {
    repeat += 1;
    waypointLabel = 'A';
  }
  else {
    waypointLabel = String.fromCharCode(waypointLabel.charCodeAt(0) + 1);
  }

  return newLabel;
};

class Anchor extends PointOfInterest implements PointOfInterestInterface {
  trailMarker: TrailMarker | null;

  trail: TrailPoint[];

  trailLength: number;

  route: RouteInterface;

  constructor(
    type: MarkerType, props: AnchorProps, route: RouteInterface, map: MapInterface,
  ) {
    super(props.id, null, 'waypoint', new L.LatLng(props.lat, props.lng), true, true, map);

    this.id = props.id;
    this.trail = props.trail ?? [];
    this.trailLength = props.trailLength;

    // if (props.type === 'waypoint') {
    //   this.label = getWaypointLabel() ?? null;
    // }

    this.route = route;

    makeObservable(this, {
      trail: observable,
      trailLength: observable,
    });

    this.trailMarker = new TrailMarker(
      wayPointUrl,
    );
  }

  async move(latLng: LatLng): Promise<LatLng> {
    return this.route.moveWaypoint(this.id, latLng);
  }

  update(props: AnchorProps): void {
    this.trail = props.trail ?? [];
    this.trailLength = props.trailLength;
    this.marker.latLng = { lat: props.lat, lng: props.lng };
  }

  setLabel(): void {
    this.marker.label = getWaypointLabel();
  }

  async delete(): Promise<void> {
    this.route.map.setWaiting(true);

    const response = await Http.delete<RouteUpdateResponse>(`/api/hike/${this.route.hike.id}/route/waypoint/${this.id}`);

    if (response.ok) {
      const updates = await response.body();

      runInAction(() => {
        if (updates) {
          this.route.updateRoute(updates);
        }

        this.marker.remove();

        this.route.map.setWaiting(false);
      });
    }
    else {
      this.route.map.setWaiting(false);
    }
  }
}

export default Anchor;
export { resetWaypointLabel };
