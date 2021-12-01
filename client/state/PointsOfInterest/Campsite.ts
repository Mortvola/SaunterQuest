import L from 'leaflet';
import Marker from '../Marker';
import { MapInterface } from '../Types';

class Campsite {
  id: number;

  name: string;

  marker: Marker;

  constructor(id: number, name: string, position: L.LatLng, map: MapInterface) {
    this.id = id;
    this.name = name;
    this.marker = new Marker(
      'campsite', position, false, false, map,
    );
  }
}

export default Campsite;
