import { MapInterface, PointOfInterestInterface } from '../Types';
import PointOfInterest from './PointOfInterset';

class Day extends PointOfInterest implements PointOfInterestInterface {
  constructor(id: number, name: string, position: L.LatLng, map: MapInterface) {
    super(id, name, 'day', position, false, false, map);
  }
}

export default Day;
