import Marker from '../Marker';
import { MapInterface, MarkerType, PointOfInterestInterface } from '../Types';
import * as Icons from './Icons';

class PointOfInterest implements PointOfInterestInterface {
  id: number;

  name: string | null = null;

  selected = false;

  marker: Marker;

  #map: MapInterface;

  constructor(
    id: number,
    name: string | null,
    type: MarkerType,
    position: L.LatLng,
    moveable: boolean,
    deletable: boolean,
    map: MapInterface,
  ) {
    this.id = id;
    this.name = name;
    this.marker = new Marker(
      type, { lat: position.lat, lng: position.lng }, moveable, deletable, map,
    );
    this.#map = map;
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    if (this.selected) {
      this.#map.addMarkerSelection(this);
    }
    else {
      this.#map.removeMarkerSelection(this);
    }
  }

  toggleSelection(): void {
    this.selected = !this.selected;

    if (this.selected) {
      this.#map.addMarkerSelection(this);
    }
    else {
      this.#map.removeMarkerSelection(this);
    }
  }

  getTypeString(): string {
    switch (this.marker.type) {
      case 'campsite':
        return 'Campsite';

      case 'day':
        return 'Day';

      case 'finish':
        return 'Finish';

      case 'start':
        return 'Start';

      case 'resupply':
        return 'Resupply';

      case 'water':
        return 'Water';

      case 'waypoint':
        return 'Waypoint';

      case 'city':
        return 'City';

      case 'postoffice':
        return 'Post Office';

      case 'photo':
        return 'Photo';

      default:
        return 'Unknown';
    }
  }

  getIcon(): string | null {
    switch (this.marker.type) {
      case 'start':
        return Icons.start;
      case 'finish':
        return Icons.finish;
      case 'waypoint':
        return Icons.compass;
      case 'campsite':
        return Icons.campsite;
      case 'day':
        return Icons.moon;
      case 'water':
        return Icons.water;
      case 'resupply':
        return Icons.resupply;
      case 'city':
        return Icons.city;
      case 'postoffice':
        return Icons.postoffice;
      case 'rv':
        return Icons.rv;
      case 'photo':
        return Icons.photo;
      default:
        return null;
    }
  }
}

export default PointOfInterest;
