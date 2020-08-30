import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import PropTypes from 'prop-types';
import 'regenerator-runtime/runtime';
import store from './redux/store';
import Hikes from './Hikes/Hikes';
import Menubar from './Menubar';
import { VIEW_HIKES, VIEW_HIKE, VIEW_GEAR } from './menuEvents';
import Hike from './Hike/Hike';

const mapStateToProps = (state) => ({
    view: state.selections.view,
});

const App = ({
    view,
}) => {
    const renderView = () => {
        switch (view) {
        case VIEW_HIKES:
            return <Hikes />;

        case VIEW_HIKE:
            return <Hike />;

        case VIEW_GEAR:
        default:
            return <div />;
        }
    };

    return (
        <>
            <Menubar />
            {renderView()}
        </>
    );
};

App.propTypes = {
    view: PropTypes.string.isRequired,
};

const ConnectedApp = connect(mapStateToProps)(App);

ReactDOM.render(
    <Provider store={store}>
        <ConnectedApp />
    </Provider>,
    document.querySelector('.app'),
);
