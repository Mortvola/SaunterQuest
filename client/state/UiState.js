import { makeAutoObservable } from 'mobx';
import { VIEW_HIKES } from '../menuEvents';

class UiState {
  constructor() {
    this.view = VIEW_HIKES;
    this.hike = null;

    makeAutoObservable(this);
  }

  setView(view) {
    this.view = view;
  }

  setHike(hike) {
    this.hike = hike;
  }
}

export default UiState;
