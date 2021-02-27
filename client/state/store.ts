import { createContext } from 'react';
import HikeManager from './HikeManager';
import UiState from './UiState';

class Store {
  uiState = new UiState();

  hikeManager = new HikeManager(this);
}

const store = new Store();
const MobxStore = createContext(store);

export default MobxStore;
export { Store, store };
