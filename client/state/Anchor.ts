import { makeAutoObservable } from 'mobx';
import TrailMarker from './TrailMarker';

const wayPointUrl = 'https://maps.google.com/mapfiles/ms/micons/lightblue.png';

let waypointLabel = 'A';

const resetWaypointLabel = () => {
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

class Anchor {
  id: number;

  type: string;

  marker: TrailMarker;

  trail: Array<TrailPoint>;

  trailLength: number;

  latLng: LatLng;

  constructor(props: AnchorProps) {
    this.id = props.id;
    this.type = props.type;
    this.trail = props.trail;
    this.trailLength = props.trailLength;
    this.latLng = { lat: props.lat, lng: props.lng };

    makeAutoObservable(this);

    this.marker = new TrailMarker(
      wayPointUrl,
      this.type === 'waypoint' ? getWaypointLabel() : undefined,
    );
  }

  update(props: AnchorProps): void {
    this.type = props.type;
    this.trail = props.trail;
    this.trailLength = props.trailLength;
    this.latLng = { lat: props.lat, lng: props.lng };
  }

  setLabel(): void {
    this.marker.setLabel(this.type === 'waypoint' ? getWaypointLabel() : undefined);
  }
}

export default Anchor;
export { resetWaypointLabel };
