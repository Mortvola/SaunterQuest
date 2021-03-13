import { LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class DayMarker extends Marker implements MarkerInterface {
  constructor(latLng: LatLng) {
    super('day', latLng);
  }

  // eslint-disable-next-line class-methods-use-this
  move = async (_latLng: LatLng): Promise<LatLng> => {
    throw new Error('cannot move day marker');
  }
}

export default DayMarker;
