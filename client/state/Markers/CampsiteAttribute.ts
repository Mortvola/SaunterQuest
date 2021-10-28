import { LatLng, MarkerAttributeInterface } from '../Types';
import Marker from './MarkerAttribute';

class CampsiteAttribute extends Marker implements MarkerAttributeInterface {
  constructor(latLng: LatLng) {
    super('campsite', latLng, true);
  }
}

export default CampsiteAttribute;
