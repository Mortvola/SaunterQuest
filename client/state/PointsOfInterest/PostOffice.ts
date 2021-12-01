import L from 'leaflet';
import Marker from '../Marker';
import { MapInterface } from '../Types';

class PostOffice {
  id: number;

  marker: Marker;

  constructor(id: number, position: L.LatLng, map: MapInterface) {
    this.id = id;
    this.marker = new Marker(
      'postoffice', position, false, false, map,
    );
  }
}

export default PostOffice;
