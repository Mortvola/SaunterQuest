import { makeObservable, observable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import TrailMarker from '../TrailMarker';
import {
  LatLng, MarkerAttributeInterface, MarkerAttributeTypes, RouteInterface, TrailPoint,
} from '../Types';
import { AnchorProps, RouteUpdateResponse } from '../../../common/ResponseTypes';
import MarkerAttribute from './MarkerAttribute';

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

class AnchorAttribute extends MarkerAttribute implements MarkerAttributeInterface {
  id: number;

  marker: TrailMarker;

  trail: TrailPoint[];

  trailLength: number;

  route: RouteInterface;

  constructor(type: MarkerAttributeTypes, props: AnchorProps, route: RouteInterface) {
    super(type, { lat: props.lat, lng: props.lng }, true, true);

    this.id = props.id;
    this.trail = props.trail ?? [];
    this.trailLength = props.trailLength;

    if (props.type === 'waypoint') {
      this.label = getWaypointLabel() ?? null;
    }

    this.route = route;

    makeObservable(this, {
      trail: observable,
      trailLength: observable,
      type: observable,
    });

    this.marker = new TrailMarker(
      wayPointUrl,
      this.label,
    );
  }

  move = async (latLng: LatLng): Promise<LatLng> => (
    this.route.moveWaypoint(this.id, latLng)
  )

  update(props: AnchorProps): void {
    this.trail = props.trail ?? [];
    this.trailLength = props.trailLength;
    this.latLng = { lat: props.lat, lng: props.lng };
  }

  setLabel(): void {
    this.label = getWaypointLabel();
    this.marker.setLabel(this.label);
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

        super.delete();

        this.route.map.setWaiting(false);
      });
    }
    else {
      this.route.map.setWaiting(false);
    }
  }
}

export default AnchorAttribute;
export { resetWaypointLabel };
