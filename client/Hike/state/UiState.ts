import { LatLng } from 'leaflet';
import { makeAutoObservable, runInAction } from 'mobx';
import Hike from './Hike';
import { MarkerType, PhotoInterface } from './Types';

class UiState {
  location3d: LatLng | null = null;

  photo: PhotoInterface | null = null;

  editPhoto = false;

  // toggleMarker(markerTypes: MarkerType): void {
  //   runInAction(() => {
  //     this.showMarkers.set(markerTypes, !this.showMarkers.get(markerTypes));
  //   });
  // }

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
