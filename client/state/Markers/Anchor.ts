import { makeObservable, observable } from 'mobx';
import TrailMarker from '../TrailMarker';
import {
  AnchorProps, LatLng, MarkerInterface, RouteInterface, TrailPoint,
} from '../Types';
import Marker from './Marker';

const wayPointUrl = 'compass.svg';

let waypointLabel = 'A';

const resetWaypointLabel = (): void => {
  waypointLabel = 'A';
};

const getWaypointLabel = () => {
  const label = waypointLabel;

  // Get the next label. If the current label is Z then
  // start uing lower case letters.
  // TODO: Should switch to using two letters but wider icons will be needed.
  if (waypointLabel === 'Z') {
    waypointLabel = 'a';
  }
  else {
    waypointLabel = String.fromCharCode(waypointLabel.charCodeAt(0) + 1);
  }

  return label;
};

class Anchor extends Marker implements MarkerInterface {
  id: number;

  marker: TrailMarker;

  trail: Array<TrailPoint>;

  trailLength: number;

  route: RouteInterface;

  constructor(props: AnchorProps, route: RouteInterface) {
    super('waypoint', { lat: props.lat, lng: props.lng }, true);

    this.id = props.id;
    this.trail = props.trail;
    this.trailLength = props.trailLength;

    this.route = route;

    makeObservable(this, {
      trail: observable,
      trailLength: observable,
    });

    this.marker = new TrailMarker(
      wayPointUrl,
      getWaypointLabel(),
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
    this.marker.setLabel(getWaypointLabel());
  }
}

export default Anchor;
export { resetWaypointLabel };
