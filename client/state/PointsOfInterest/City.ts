import L from 'leaflet';
import { MapInterface, PointOfInterestInterface } from '../Types';
import PointOfInterest from './PointOfInterset';

class City extends PointOfInterest implements PointOfInterestInterface {
  constructor(id: number, name: string, position: L.LatLng, map: MapInterface) {
    super(id, name, 'city', position, false, false, map);
  }
}

export default City;
