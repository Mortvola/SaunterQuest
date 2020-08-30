import {
    takeEvery, put, all, select,
} from 'redux-saga/effects';
import {
    REQUEST_ROUTE,
    ROUTE_UPDATED,
    ADD_WAYPOINT,
    ADD_START_WAYPOINT,
    ADD_END_WAYPOINT,
} from './actionTypes';
import {
    requestRoute, receiveRoute, receiveSchedule, receiveRouteUpdates, routeUpdated,
} from './actions';

function* fetchRoute(action) {
    const route = yield fetch(`${sessionStorage.getItem('hikeId')}/route`)
        .then(async (response) => {
            if (response.ok) {
                action.route.setAnchors(await response.json());

                return action.route;
            }

            return null;
        });

    yield put(receiveRoute(route));
}

function* requestSchedule() {
    const schedule = yield fetch(`${sessionStorage.getItem('hikeId')}/schedule`)
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    yield put(receiveSchedule(schedule));
}

function* postWaypoint(action) {
    const updates = yield fetch(`${sessionStorage.getItem('hikeId')}/route/waypoint`, {
        method: 'POST',
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Content-type': 'application/json',
        },
        body: JSON.stringify({ lat: action.position.lat, lng: action.position.lng }),
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    if (updates === null) {
        const route = yield select((state) => state.map.route);
        yield put(requestRoute(route));
    }
    else {
        yield put(receiveRouteUpdates(updates));
        yield put(routeUpdated());
    }
}

function* postStartWaypoint(action) {
    const updates = yield fetch(`${sessionStorage.getItem('hikeId')}/route/startPoint`, {
        method: 'POST',
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Content-type': 'application/json',
        },
        body: JSON.stringify({ lat: action.position.lat, lng: action.position.lng }),
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    if (updates === null) {
        const { map: route } = yield select();
        yield put(requestRoute(route));
    }
    else {
        yield put(receiveRouteUpdates(updates));
        yield put(routeUpdated());
    }
}

function* postEndWaypoint(action) {
    const updates = yield fetch(`${sessionStorage.getItem('hikeId')}/route/endPoint`, {
        method: 'POST',
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Content-type': 'application/json',
        },
        body: JSON.stringify({ lat: action.position.lat, lng: action.position.lng }),
    })
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    if (updates === null) {
        const { map: route } = yield select();
        yield put(requestRoute(route));
    }
    else {
        yield put(receiveRouteUpdates(updates));
        yield put(routeUpdated());
    }
}

function* watchRouteRequests() {
    yield takeEvery(REQUEST_ROUTE, fetchRoute);
}

function* watchRouteUpdated() {
    yield takeEvery(ROUTE_UPDATED, requestSchedule);
}

function* watchAddWaypoint() {
    yield takeEvery(ADD_WAYPOINT, postWaypoint);
}

function* watchAddStartWaypoint() {
    yield takeEvery(ADD_START_WAYPOINT, postStartWaypoint);
}

function* watchAddEndWaypoint() {
    yield takeEvery(ADD_END_WAYPOINT, postEndWaypoint);
}

export default function* rootSaga() {
    yield all([
        watchRouteRequests(),
        watchRouteUpdated(),
        watchAddWaypoint(),
        watchAddStartWaypoint(),
        watchAddEndWaypoint(),
    ]);
}
