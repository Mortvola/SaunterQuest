import { LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class CampsiteMarker extends Marker implements MarkerInterface {
  constructor(latLng: LatLng) {
    super('campsite', latLng, true);
  }
}

export default CampsiteMarker;
