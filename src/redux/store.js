import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import hikeApp from './reducers';

const development = false;
let enhancer = null;

if (development) {
    enhancer = composeWithDevTools(
        applyMiddleware(
            thunkMiddleware, // lets us dispatch() functions
            createLogger(), // neat middleware that logs actions
        ),
    );
}
else {
    enhancer = applyMiddleware(
        thunkMiddleware, // lets us dispatch() functions
    );
}

const store = createStore(
    hikeApp,
    enhancer,
);

export default store;
