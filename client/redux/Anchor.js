import { makeAutoObservable } from 'mobx';
import TrailMarker from '../Hike/trailMarker/trailMarker';

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
  constructor(props) {
    this.marker = null;

    makeAutoObservable(this);

    this.setAnchor(props);

    this.marker = new TrailMarker(
      wayPointUrl,
      this.type === 'waypoint' ? getWaypointLabel() : undefined,
    );
  }

  setAnchor(props) {
    if (props) {
      Object.keys(props).forEach((key) => {
        this[key] = props[key];
      });
    }
  }
}

export default Anchor;
export { resetWaypointLabel };
