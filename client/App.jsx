import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
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

const App = ({
  username,
  tileServerUrl,
  extendedMenu,
}) => (
  <DndProvider backend={HTML5Backend}>
    <Menubar username={username} />
    <Switch>
      <Route path="/hike">
        <Hike tileServerUrl={tileServerUrl} extendedMenu={extendedMenu} />
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

App.propTypes = {
  username: PropTypes.string.isRequired,
  tileServerUrl: PropTypes.string.isRequired,
  extendedMenu: PropTypes.bool,
};

App.defaultProps = {
  extendedMenu: false,
};

const ConnectedApp = observer(App);
let initialProps = document.querySelector('.app').getAttribute('data-props');
initialProps = JSON.parse(initialProps);

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <Router>
      <ConnectedApp {...initialProps} />
    </Router>
  </StoreContext.Provider>,
  document.querySelector('.app'),
);
