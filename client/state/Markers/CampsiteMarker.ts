import { LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class CampsiteMarker extends Marker implements MarkerInterface {
  constructor(latLng: LatLng) {
    super('campsite', latLng);
  }

  move = async (latLng: LatLng): Promise<LatLng> => {
    this.latLng = latLng;

    return latLng;
  }
}

export default CampsiteMarker;
