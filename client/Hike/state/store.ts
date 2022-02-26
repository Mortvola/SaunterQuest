import { createContext, useContext } from 'react';
import { StoreInterface } from './Types';
import UiState from './UiState';

class Store implements StoreInterface {
  uiState = new UiState();
}

const store = new Store();
const StoreContext = createContext<Store>(store);

const useStores = (): Store => (
  useContext(StoreContext)
);

export {
  Store, store, useStores, StoreContext,
};
