import { makeAutoObservable } from 'mobx';
import { VIEW_HIKES } from '../menuEvents';
import GearConfiguration from './GearConfiguration';
import Hike from './Hike';

class UiState {
  view: string = VIEW_HIKES;

  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

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
