import { createContext, useContext } from 'react';
import Gear from './Gear';
import Gpx from './Gpx';
import HikeManager from './HikeManager';
import UiState from './UiState';

class Store {
  uiState = new UiState();

  hikeManager = new HikeManager(this);

  gear = new Gear(this);

  gpx = new Gpx();
}

const store = new Store();
const StoreContext = createContext<Store>(store);

const useStores = (): Store => (
  useContext(StoreContext)
);

export {
  Store, store, useStores, StoreContext,
};
