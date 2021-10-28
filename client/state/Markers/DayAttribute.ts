import { Day, LatLng, MarkerAttributeInterface } from '../Types';
import Marker from './MarkerAttribute';

class DayAttribute extends Marker implements MarkerAttributeInterface {
  day: Day;

  constructor(day: Day, latLng: LatLng) {
    super('day', latLng, false);

    this.day = day;
  }
}

export default DayAttribute;
