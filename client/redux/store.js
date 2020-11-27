// import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';
import hikeApp from './reducers';
import rootSaga from './sagas';

let enhancer = null;

const sagaMiddleware = createSagaMiddleware();

if (process.env.NODE_ENV === 'production') {
  enhancer = applyMiddleware(
    sagaMiddleware, // lets us dispatch() functions
  );
}
else {
  enhancer = composeWithDevTools(
    applyMiddleware(
      thunk,
      sagaMiddleware, // lets us dispatch() functions
      createLogger(), // neat middleware that logs actions
    ),
  );
}

const store = createStore(hikeApp, enhancer);

sagaMiddleware.run(rootSaga);

export default store;
