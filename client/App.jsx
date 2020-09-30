import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import PropTypes from 'prop-types';
import 'regenerator-runtime/runtime';
import 'leaflet-contextmenu';
import store from './redux/store';
import Hikes from './Hikes/Hikes';
import Menubar from './Menubar';
import { VIEW_HIKES, VIEW_HIKE, VIEW_GEAR } from './menuEvents';
import Hike from './Hike/Hike';

const mapStateToProps = (state) => ({
    view: state.selections.view,
});

const App = ({
    username,
    tileServerUrl,
    view,
}) => {
    const renderView = () => {
        switch (view) {
        case VIEW_HIKES:
            return <Hikes />;

        case VIEW_HIKE:
            return <Hike tileServerUrl={tileServerUrl} />;

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
    view: PropTypes.string.isRequired,
};

const ConnectedApp = connect(mapStateToProps)(App);
let initialProps = document.querySelector('.app').getAttribute('data-props');
initialProps = JSON.parse(initialProps);

ReactDOM.render(
    <Provider store={store}>
        <ConnectedApp {...initialProps} />
    </Provider>,
    document.querySelector('.app'),
);
