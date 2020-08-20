import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'regenerator-runtime/runtime';
import store from './redux/store';
import Hikes from './Hikes/Hikes';

const App = () => (
    <Hikes />
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.querySelector('.app'),
);
