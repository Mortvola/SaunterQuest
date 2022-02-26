import { makeAutoObservable, runInAction } from 'mobx';
import GearConfiguration from './GearConfiguration';
import Hike from '../../Hike/state/Hike';

class UiState {
  hike: Hike | null = null;

  selectedGearConfiguration: GearConfiguration | null = null;

  gearConfigSort = 'System';

  blog = false;

  constructor() {
    makeAutoObservable(this);
  }

  setHike(hike: Hike | null): void {
    runInAction(() => {
      this.hike = hike;
    });
  }

  viewBlog(): void {
    runInAction(() => {
      this.blog = true;
    });
  }
}

export default UiState;
