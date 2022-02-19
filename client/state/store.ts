import { createContext, useContext } from 'react';
import BlogManager from './Blog/BlogManager';
import Gear from './Gear';
import Gpx from './Gpx';
import HikeManager from './HikeManager';
import { StoreInterface } from './Types';
import UiState from './UiState';

class Store implements StoreInterface {
  uiState = new UiState();

  hikeManager: HikeManager = new HikeManager(this);

  gear: Gear = new Gear(this);

  gpx: Gpx = new Gpx();

  blogManager = new BlogManager();
}

const store = new Store();
const StoreContext = createContext<Store>(store);

const useStores = (): Store => (
  useContext(StoreContext)
);

export {
  Store, store, useStores, StoreContext,
};
