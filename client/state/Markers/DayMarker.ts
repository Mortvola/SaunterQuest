import { LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class DayMarker extends Marker implements MarkerInterface {
  constructor(latLng: LatLng) {
    super('day', latLng, false);
  }
}

export default DayMarker;
