import { LatLng } from 'leaflet';
import { makeAutoObservable, runInAction } from 'mobx';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';
import { MarkerType, MarkerInterface } from './Types';

class UiState {
  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  location3d: LatLng | null = null;

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
      this.location3d = position;
    });
  }
}

export default UiState;
