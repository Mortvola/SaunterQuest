import { createContext } from 'react';
import HikeManager from './HikeManager';
import UiState from './UiState';

const store = {
  uiState: new UiState(),
  hikeManager: new HikeManager(),
};

const MobxStore = createContext(store);

export default MobxStore;
export { store };
