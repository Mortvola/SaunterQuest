import React, { createContext, useContext } from 'react';
import BlogManager from './BlogManager';

class Store {
  blogManager: BlogManager = new BlogManager();
}

const store = new Store();
const StoreContext = createContext<Store>(store);

const useStores = (): Store => (
  useContext(StoreContext)
);

type PropsType = {
  children: React.ReactNode,
}

const BlogStore: React.FC<PropsType> = ({ children }) => (
  <StoreContext.Provider value={store}>
    {
      children
    }
  </StoreContext.Provider>
);

export default BlogStore;
export {
  Store, store, useStores, StoreContext,
};
