import { LatLng, MarkerInterface } from '../Types';
import Marker from './Marker';

class WaterMarker extends Marker implements MarkerInterface {
  constructor(latLng: LatLng) {
    super('water', latLng);
  }

  move = async (latLng: LatLng): Promise<LatLng> => {
    this.latLng = latLng;

    return latLng;
  }
}

export default WaterMarker;
