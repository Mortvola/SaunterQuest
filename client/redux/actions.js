import {
  REQUEST_HIKE,
  SET_VIEW,
  SET_MAP,
  RECEIVE_SCHEDULE,
  REQUEST_ROUTE,
  RECEIVE_ROUTE,
  ROUTE_UPDATED,
  ADD_WAYPOINT,
  ADD_START_WAYPOINT,
  ADD_END_WAYPOINT,
  MOVE_WAYPOINT,
  DELETE_WAYPOINT,
  RECEIVE_ANCHOR_UPDATES,
  SHOW_LOCATION_POPUP,
} from './actionTypes';

const requestHike = (id) => ({
  type: REQUEST_HIKE,
  id,
});

const setView = (view, params) => ({
  type: SET_VIEW,
  view,
  params,
});

const requestRoute = (hikeId) => ({
  type: REQUEST_ROUTE,
  hikeId,
});

const receiveRoute = (route) => ({
  type: RECEIVE_ROUTE,
  route,
});

const receiveSchedule = (schedule) => ({
  type: RECEIVE_SCHEDULE,
  schedule,
});

const routeUpdated = (hikeId) => ({
  type: ROUTE_UPDATED,
  hikeId,
});

const setMap = (map) => ({
  type: SET_MAP,
  map,
});

const addWaypoint = (hikeId, position) => ({
  type: ADD_WAYPOINT,
  hikeId,
  position,
});

const addStartWaypoint = (hikeId, position) => ({
  type: ADD_START_WAYPOINT,
  hikeId,
  position,
});

const addEndWaypoint = (hikeId, position) => ({
  type: ADD_END_WAYPOINT,
  hikeId,
  position,
});

const moveWaypoint = (hikeId, waypoint, point) => ({
  type: MOVE_WAYPOINT,
  hikeId,
  waypoint,
  point,
});

const deleteWaypoint = (hikeId, id) => ({
  type: DELETE_WAYPOINT,
  hikeId,
  id,
});

const receiveWaypointUpdates = (updates) => ({
  type: RECEIVE_ANCHOR_UPDATES,
  updates,
});

const showLocationPopup = (latlng) => ({
  type: SHOW_LOCATION_POPUP,
  latlng,
});

export {
  setView,
  requestHike,
  setMap,
  receiveSchedule,
  requestRoute,
  receiveRoute,
  routeUpdated,
  addWaypoint,
  addStartWaypoint,
  addEndWaypoint,
  moveWaypoint,
  deleteWaypoint,
  receiveWaypointUpdates,
  showLocationPopup,
};
