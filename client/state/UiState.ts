import { LatLng } from 'leaflet';
import { makeAutoObservable, runInAction } from 'mobx';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';
import { MarkerAttributeTypes } from './Types';

class UiState {
  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  show3D = false;

  location3d: LatLng | null = null;

  toggleMarker(marker: MarkerAttributeTypes): void {
    runInAction(() => {
      this.showMarkers.set(marker, !this.showMarkers.get(marker));
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
}

export default UiState;
