import { makeAutoObservable, runInAction } from 'mobx';
import { VIEW_HIKES } from '../menuEvents';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';
import { MarkerTypes } from './Types';

class UiState {
  view: string = VIEW_HIKES;

  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  toggleMarker(marker: MarkerTypes): void {
    runInAction(() => {
      this.showMarkers.set(marker, !this.showMarkers.get(marker));
    });
  }

  showMarkers = new Map<MarkerTypes, boolean>([
    ['day', true],
    ['water', true],
    ['waypoint', true],
    ['campsite', true],
    ['resupply', true],
  ]);

  constructor() {
    makeAutoObservable(this);
  }

  setView(view: string): void {
    this.view = view;
  }

  setHike(hike: Hike): void {
    this.hike = hike;
  }
}

export default UiState;
