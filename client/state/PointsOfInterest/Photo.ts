import L from 'leaflet';
import { MapInterface, PointOfInterestInterface } from '../Types';
import PointOfInterest from './PointOfInterset';

class Photo extends PointOfInterest implements PointOfInterestInterface {
  constructor(id: number, position: L.LatLng, map: MapInterface) {
    super(id, null, 'photo', position, false, false, map);
  }
}

export default Photo;
