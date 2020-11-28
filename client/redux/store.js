import { createContext } from 'react';
import HikeManager from './HikeManager';
import UiState from './UiState';

const mobxStore = {
  uiState: new UiState(),
  hikeManager: new HikeManager(),
};

const MobxStore = createContext(mobxStore);

export default MobxStore;
export { mobxStore };
