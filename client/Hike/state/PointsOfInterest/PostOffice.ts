import L from 'leaflet';
import { MapInterface, PointOfInterestInterface } from '../Types';
import PointOfInterest from './PointOfInterset';

class PostOffice extends PointOfInterest implements PointOfInterestInterface {
  constructor(id: number, position: L.LatLng, map: MapInterface) {
    super(id, null, 'postoffice', position, false, false, map);
  }
}

export default PostOffice;
