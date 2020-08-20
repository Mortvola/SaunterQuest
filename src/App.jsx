import React from 'react';
import ReactDOM from 'react-dom';
import 'regenerator-runtime/runtime';
import Hikes from './Hikes/Hikes';

const App = () => (
    <Hikes />
);

ReactDOM.render(
    <App />,
    document.querySelector('.app'),
);
