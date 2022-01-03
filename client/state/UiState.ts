import { LatLng } from 'leaflet';
import { makeAutoObservable, runInAction } from 'mobx';
import { PhotoInterface } from '../welcome/state/Types';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';
import { MarkerType } from './Types';

class UiState {
  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  location3d: LatLng | null = null;

  photo: PhotoInterface | null = null;

  editPhoto = false;

  toggleMarker(markerTypes: MarkerType): void {
    runInAction(() => {
      this.showMarkers.set(markerTypes, !this.showMarkers.get(markerTypes));
    });
  }

  showMarkers = new Map<MarkerType, boolean>([
    ['day', true],
    ['water', true],
    ['waypoint', true],
    ['campsite', true],
    ['resupply', true],
  ]);

  constructor() {
    makeAutoObservable(this);
  }

  setHike(hike: Hike | null): void {
    runInAction(() => {
      this.hike = hike;
    });
  }

  showIn3D(position: L.LatLng | null): void {
    runInAction(() => {
      this.photo = null;
      this.editPhoto = false;
      this.location3d = position;
    });
  }

  repositionPhoto(photo: PhotoInterface, position: L.LatLng | null): void {
    runInAction(() => {
      this.photo = photo;
      this.editPhoto = true;
      this.location3d = position;
    });
  }
}

export default UiState;
