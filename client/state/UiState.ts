import { makeAutoObservable } from 'mobx';
import { VIEW_HIKES } from '../menuEvents';

class UiState {
  view: string = VIEW_HIKES;

  hike: unknown = null;

  constructor() {
    makeAutoObservable(this);
  }

  setView(view: string): void {
    this.view = view;
  }

  setHike(hike: unknown): void {
    this.hike = hike;
  }
}

export default UiState;
