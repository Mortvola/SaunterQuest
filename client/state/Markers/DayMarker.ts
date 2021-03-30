import { Day, LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class DayMarker extends Marker implements MarkerInterface {
  day: Day;

  constructor(day: Day, latLng: LatLng) {
    super('day', latLng, false);

    this.day = day;
  }
}

export default DayMarker;
