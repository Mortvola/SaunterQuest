import { makeObservable, observable } from 'mobx';
import TrailMarker from '../TrailMarker';
import {
  AnchorProps, LatLng, MarkerAttributeInterface, RouteInterface, TrailPoint,
} from '../Types';
import Marker from './MarkerAttribute';

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

class AnchorAttribute extends Marker implements MarkerAttributeInterface {
  id: number;

  marker: TrailMarker;

  trail: TrailPoint[];

  trailLength: number;

  route: RouteInterface;

  constructor(props: AnchorProps, route: RouteInterface) {
    super('waypoint', { lat: props.lat, lng: props.lng }, true);

    this.id = props.id;
    this.trail = props.trail;
    this.trailLength = props.trailLength;

    if (props.type === 'waypoint') {
      this.label = getWaypointLabel() ?? null;
    }

    this.route = route;

    makeObservable(this, {
      trail: observable,
      trailLength: observable,
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
    this.trail = props.trail;
    this.trailLength = props.trailLength;
    this.latLng = { lat: props.lat, lng: props.lng };
  }

  setLabel(): void {
    this.label = getWaypointLabel();
    this.marker.setLabel(this.label);
  }
}

export default AnchorAttribute;
export { resetWaypointLabel };
