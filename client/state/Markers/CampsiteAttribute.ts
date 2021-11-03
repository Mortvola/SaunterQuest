import { LatLng, MarkerAttributeInterface } from '../Types';
import MarkerAttribute from './MarkerAttribute';

class CampsiteAttribute extends MarkerAttribute implements MarkerAttributeInterface {
  constructor(latLng: LatLng) {
    super('campsite', latLng, true);
  }
}

export default CampsiteAttribute;
