import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'regenerator-runtime/runtime';
import 'leaflet-contextmenu';
import Leaflet from 'leaflet';
import { observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Hikes from './Hikes/Hikes';
import Menubar from './Menubar';
import Hike from './Hike/Hike';
import { store, StoreContext } from './state/store';
import Gear from './Gear/Gear';

Leaflet.Icon.Default.imagePath = '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/';

type PropsType = {
  username: string,
  tileServerUrl: string,
  pathFinderUrl: string,
  extendedMenu: string,
}

const App = ({
  username,
  tileServerUrl,
  pathFinderUrl,
  extendedMenu,
}: PropsType): ReactElement => (
  <DndProvider backend={HTML5Backend}>
    <Menubar username={username} />
    <Switch>
      <Route path="/hike">
        <Hike
          tileServerUrl={tileServerUrl}
          pathFinderUrl={pathFinderUrl}
          extendedMenu={extendedMenu}
        />
      </Route>
      <Route path="/gear">
        <Gear />
      </Route>
      <Route path="/food">
        <div />
      </Route>
      <Route path="/">
        <Hikes />
      </Route>
    </Switch>
  </DndProvider>
);

const appElement = document.querySelector('.app');
if (appElement === null) {
  throw new Error('app element could not be found');
}

const initialPropsString = appElement.getAttribute('data-props');
if (initialPropsString === null) {
  throw new Error('initialProps attribute could not be found');
}

const initialProps = JSON.parse(initialPropsString) as PropsType;

const ConnectedApp = observer(App);

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <Router>
      <ConnectedApp {...initialProps} />
    </Router>
  </StoreContext.Provider>,
  document.querySelector('.app'),
);