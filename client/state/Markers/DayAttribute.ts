import { Day, LatLng, MarkerAttributeInterface } from '../Types';
import MarkerAttribute from './MarkerAttribute';

class DayAttribute extends MarkerAttribute implements MarkerAttributeInterface {
  day: Day;

  constructor(day: Day, latLng: LatLng) {
    super('day', latLng, false);

    this.day = day;
  }
}

export default DayAttribute;
