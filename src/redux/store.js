import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import hikeApp from './reducers';

let enhancer = null;

if (process.env.NODE_ENV === 'production') {
    enhancer = applyMiddleware(
        thunkMiddleware, // lets us dispatch() functions
    );
}
else {
    enhancer = composeWithDevTools(
        applyMiddleware(
            thunkMiddleware, // lets us dispatch() functions
            createLogger(), // neat middleware that logs actions
        ),
    );
}

const store = createStore(
    hikeApp,
    enhancer,
);

export default store;
