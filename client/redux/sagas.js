import {
    takeEvery, put, all, select,
} from 'redux-saga/effects';
import {
    REQUEST_HIKES,
    REQUEST_HIKE,
    REQUEST_HIKE_DETAILS,
    REQUEST_HIKE_DELETION,
    REQUEST_ROUTE,
    ROUTE_UPDATED,
    ADD_WAYPOINT,
    ADD_START_WAYPOINT,
    ADD_END_WAYPOINT,
    REQUEST_HIKER_PROFILES,
    REQUEST_HIKER_PROFILE_DELETION,
} from './actionTypes';
import {
    VIEW_HIKE,
} from '../menuEvents';
import {
    requestingHikes, receiveHikes, requestRoute, receiveRoute, receiveSchedule,
    receiveRouteUpdates, routeUpdated,
    receiveHikerProfiles, deleteHikerProfile, setView,
    deleteHike, receiveHikeDetails,
} from './actions';

function* fetchHikes() {
    yield put(requestingHikes(true));

    const hikes = yield fetch('/hikes')
        .then(async (response) => {
            if (response.ok) {
                const json = await response.json();
                if (Array.isArray(json)) {
                    json.sort((a, b) => {
                        const nameA = a.name.toUpperCase(); // ignore upper and lowercase
                        const nameB = b.name.toUpperCase(); // ignore upper and lowercase

                        if (nameA < nameB) {
                            return -1;
                        }

                        if (nameA > nameB) {
                            return 1;
                        }

                        // names must be equal
                        return 0;
                    });

                    return json;
                }
            }

            return null;
        });

    if (hikes) {
        yield put(receiveHikes(hikes));
    }

    // todo: handle error case

    yield put(requestingHikes(false));
}

function* fetchHikeDetails(action) {
    const details = yield fetch(`/hike/${action.id}/details`)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    yield put(receiveHikeDetails(action.id, details));
}

function* fetchHike(action) {
    try {
        yield put(setView(VIEW_HIKE, { hikeId: action.id }));
    }
    catch(error) {
        console.log(error);
    }
}

function* requestHikeDeletion(action) {
    const deleted = fetch(`hike/${action.id}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
        .then((response) => {
            if (response.ok) {
                return true;
            }

            return false;
        });

    if (deleted) {
        yield put(deleteHike(action.id));
    }

    // todo: handle error case
}

function* fetchRoute(action) {
    const route = yield fetch(`/hike/${action.hikeId}/route`)
        .then(async (response) => {
            if (response.ok) {
                action.route.setAnchors(await response.json());

                return action.route;
            }

            return null;
        });

    if (route) {
        yield put(receiveRoute(route));
    }

    // todo: handle error case
}

function* requestSchedule(action) {
    try {
        const schedule = yield fetch(`/hike/${action.hikeId}/schedule`)
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

        yield put(receiveSchedule(schedule));
    }
    catch (error) {
        console.log(error);
    }
}

function* postWaypoint(action) {
    const updates = yield fetch(`/hike/${action.hikeId}/route/waypoint`, {
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
        yield put(routeUpdated(action.hikeId));
    }
}

function* postStartWaypoint(action) {
    const updates = yield fetch(`/hike/${action.hikeId}/route/startPoint`, {
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
        yield put(routeUpdated(action.hikeId));
    }
}

function* postEndWaypoint(action) {
    const updates = yield fetch(`/hike/${action.hikeId}/route/end-point`, {
        method: 'POST',
        headers: {
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
        yield put(routeUpdated(action.hikeId));
    }
}

function* fetchHikerProfiles(action) {
    const profiles = yield fetch(`/hike/${action.hikeId}/hikerProfile`)
        .then(async (response) => {
            if (response.ok) {
                return response.json();
            }

            return null;
        });

    yield put(receiveHikerProfiles(profiles));
}

function* requestHikerProfileDeletion(action) {
    const deleted = yield fetch(`/hike/${action.hikeId}/hikerProfile/${action.id}`, {
        method: 'DELETE',
        headers:
        {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
        .then(async (response) => {
            if (response.ok) {
                return true;
            }

            return false;
        });

    if (deleted) {
        yield put(deleteHikerProfile(action.id));
    }

    // todo: handle the error case.
}

function* watchHikesRequests() {
    yield takeEvery(REQUEST_HIKES, fetchHikes);
}

function* watchHikeRequests() {
    yield takeEvery(REQUEST_HIKE, fetchHike);
}

function* watchHikeDeleteionRequest() {
    yield takeEvery(REQUEST_HIKE_DELETION, requestHikeDeletion);
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

function* watchHikerProfilesRequest() {
    yield takeEvery(REQUEST_HIKER_PROFILES, fetchHikerProfiles);
}

function* watchHikerProfileDeletionRequest() {
    yield takeEvery(REQUEST_HIKER_PROFILE_DELETION, requestHikerProfileDeletion);
}

export default function* rootSaga() {
    yield all([
        watchHikesRequests(),
        watchHikeRequests(),
        yield takeEvery(REQUEST_HIKE_DETAILS, fetchHikeDetails),
        watchHikeDeleteionRequest(),
        watchRouteRequests(),
        watchRouteUpdated(),
        watchAddWaypoint(),
        watchAddStartWaypoint(),
        watchAddEndWaypoint(),
        watchHikerProfilesRequest(),
        watchHikerProfileDeletionRequest(),
    ]);
}
