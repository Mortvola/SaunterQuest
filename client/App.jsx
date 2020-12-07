import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import 'regenerator-runtime/runtime';
import 'leaflet-contextmenu';
import Leaflet from 'leaflet';
import { observer } from 'mobx-react-lite';
import Hikes from './Hikes/Hikes';
import Menubar from './Menubar';
import { VIEW_HIKES, VIEW_HIKE, VIEW_GEAR } from './menuEvents';
import Hike from './Hike/Hike';
import MobxStore, { store } from './state/store';

Leaflet.Icon.Default.imagePath = '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/';

const App = ({
  username,
  tileServerUrl,
  extendedMenu,
}) => {
  const { uiState: { view } } = useContext(MobxStore);

  const renderView = () => {
    switch (view) {
      case VIEW_HIKES:
        return <Hikes />;

      case VIEW_HIKE:
        return <Hike tileServerUrl={tileServerUrl} extendedMenu={extendedMenu} />;

      case VIEW_GEAR:
      default:
        return <div />;
    }
  };

  return (
    <>
      <Menubar username={username} />
      {renderView()}
    </>
  );
};

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
  <MobxStore.Provider value={store}>
    <ConnectedApp {...initialProps} />
  </MobxStore.Provider>,
  document.querySelector('.app'),
);
