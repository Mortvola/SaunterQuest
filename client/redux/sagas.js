import {
  takeEvery, put, all, select,
} from 'redux-saga/effects';
import {
  REQUEST_HIKE,
  REQUEST_ROUTE,
  ROUTE_UPDATED,
  ADD_WAYPOINT,
  ADD_START_WAYPOINT,
  ADD_END_WAYPOINT,
  MOVE_WAYPOINT,
  REQUEST_HIKER_PROFILES,
  REQUEST_HIKER_PROFILE_DELETION,
  DELETE_WAYPOINT,
} from './actionTypes';
import {
  VIEW_HIKE,
} from '../menuEvents';
import {
  requestRoute, receiveRoute, receiveSchedule,
  routeUpdated,
  receiveHikerProfiles, deleteHikerProfile, setView,
  receiveWaypointUpdates,
} from './actions';

function* fetchHike(action) {
  try {
    yield put(setView(VIEW_HIKE, { hikeId: action.id }));
  }
  catch (error) {
    console.log(error);
  }
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

function* fetchRoute(action) {
  try {
    const route = yield fetch(`/hike/${action.hikeId}/route`)
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        }

        return null;
      });

    if (route) {
      yield put(receiveRoute(route));
      yield put(routeUpdated(action.hikeId));
    }
  }
  catch (error) {
    console.log(error);
  }
  // todo: handle error case
}

function* postWaypoint(action) {
  const updates = yield fetch(`/hike/${action.hikeId}/route/waypoint`, {
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
    const route = yield select((state) => state.map.route);
    yield put(requestRoute(route));
  }
  else {
    yield put(receiveWaypointUpdates(updates));
    yield put(routeUpdated(action.hikeId));
  }
}

function* postStartWaypoint(action) {
  const updates = yield fetch(`/hike/${action.hikeId}/route/startPoint`, {
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
    yield put(receiveWaypointUpdates(updates));
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
    yield put(receiveWaypointUpdates(updates));
    yield put(routeUpdated(action.hikeId));
  }
}

function* fetchHikerProfiles(action) {
  const profiles = yield fetch(`/hike/${action.hikeId}/hiker-profile`)
    .then(async (response) => {
      if (response.ok) {
        return response.json();
      }

      return null;
    });

  yield put(receiveHikerProfiles(profiles));
}

function* requestHikerProfileDeletion(action) {
  const deleted = yield fetch(`/hike/${action.hikeId}/hiker-profile/${action.id}`, {
    method: 'DELETE',
    headers: {
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

function* moveWaypoint(action) {
  const updates = yield fetch(`/hike/${action.hikeId}/route/waypoint/${action.waypoint.id}/position`, {
    method: 'PUT',
    headers: {
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ ...action.point }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      return null;
    });

  if (updates) {
    yield put(receiveWaypointUpdates(updates));
  }
}

function* deleteWaypoint(action) {
  const updates = yield fetch(`/hike/${action.hikeId}/route/waypoint/${action.id}`, {
    method: 'DELETE',
    headers: {
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      return null;
    });

  if (updates) {
    yield put(receiveWaypointUpdates(updates));
  }
}

export default function* rootSaga() {
  yield all([
    yield takeEvery(REQUEST_HIKE, fetchHike),
    yield takeEvery(REQUEST_ROUTE, fetchRoute),
    yield takeEvery(ROUTE_UPDATED, requestSchedule),
    yield takeEvery(ADD_WAYPOINT, postWaypoint),
    yield takeEvery(ADD_START_WAYPOINT, postStartWaypoint),
    yield takeEvery(ADD_END_WAYPOINT, postEndWaypoint),
    yield takeEvery(MOVE_WAYPOINT, moveWaypoint),
    yield takeEvery(DELETE_WAYPOINT, deleteWaypoint),
    yield takeEvery(REQUEST_HIKER_PROFILES, fetchHikerProfiles),
    yield takeEvery(REQUEST_HIKER_PROFILE_DELETION, requestHikerProfileDeletion),
  ]);
}
