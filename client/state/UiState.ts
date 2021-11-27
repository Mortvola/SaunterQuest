import { LatLng } from 'leaflet';
import { makeAutoObservable, runInAction } from 'mobx';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';
import { MarkerAttributeTypes, MarkerInterface } from './Types';

class UiState {
  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  show3D = false;

  location3d: LatLng | null = null;

  selectedMarker: MarkerInterface | null = null;

  toggleMarker(markerTypes: MarkerAttributeTypes): void {
    runInAction(() => {
      this.showMarkers.set(markerTypes, !this.showMarkers.get(markerTypes));
    });
  }

  showMarkers = new Map<MarkerAttributeTypes, boolean>([
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

  setSelectedMarker(marker: MarkerInterface | null): void {
    runInAction(() => {
      this.selectedMarker = marker;
    });
  }
}

export default UiState;
