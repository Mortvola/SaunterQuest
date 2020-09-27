import {
    REQUEST_HIKES,
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    REQUEST_HIKE_DELETION,
    DELETE_HIKE,
    REQUEST_HIKE,
    REQUEST_HIKE_DETAILS,
    RECEIVE_HIKE_DETAILS,
    SET_VIEW,
    SET_MAP,
    RECEIVE_SCHEDULE,
    REQUEST_ROUTE,
    RECEIVE_ROUTE,
    RECEIVE_ROUTE_UPDATES,
    ROUTE_UPDATED,
    ADD_WAYPOINT,
    ADD_START_WAYPOINT,
    ADD_END_WAYPOINT,
    REQUEST_HIKER_PROFILES,
    RECEIVE_HIKER_PROFILES,
    ADD_HIKER_PROFILE,
    UPDATE_HIKER_PROFILE,
    REQUEST_HIKER_PROFILE_DELETION,
    DELETE_HIKER_PROFILE,
} from './actionTypes';

const requestHike = (id) => ({
    type: REQUEST_HIKE,
    id,
});

const requestHikeDetails = (id) => ({
    type: REQUEST_HIKE_DETAILS,
    id,
});

const receiveHikeDetails = (id, details) => ({
    type: RECEIVE_HIKE_DETAILS,
    id,
    details,
});

const setView = (view, params) => ({
    type: SET_VIEW,
    view,
    params,
});

const requestingHikes = (requesting) => ({
    type: REQUESTING_HIKES,
    requesting,
});

const receiveHikes = (hikes) => ({
    type: RECEIVE_HIKES,
    hikes,
});

const requestHikes = () => ({
    type: REQUEST_HIKES,
});

const deleteHike = (id) => ({
    type: DELETE_HIKE,
    id,
});

const requestHikeDeletion = (id) => ({
    type: REQUEST_HIKE_DELETION,
    id,
});

const requestRoute = (hikeId, route) => ({
    type: REQUEST_ROUTE,
    hikeId,
    route,
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

const receiveRouteUpdates = (updates) => ({
    type: RECEIVE_ROUTE_UPDATES,
    updates,
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

const requestHikerProfiles = (hikeId) => ({
    type: REQUEST_HIKER_PROFILES,
    hikeId,
});

const receiveHikerProfiles = (profiles) => ({
    type: RECEIVE_HIKER_PROFILES,
    profiles,
});

const updateHikerProfile = (profile) => ({
    type: UPDATE_HIKER_PROFILE,
    profile,
});

const requestHikerProfileDeletion = (hikeId, id) => ({
    type: REQUEST_HIKER_PROFILE_DELETION,
    hikeId,
    id,
});

const deleteHikerProfile = (id) => ({
    type: DELETE_HIKER_PROFILE,
    id,
});

const addHikerProfile = (profile) => ({
    type: ADD_HIKER_PROFILE,
    profile,
});

export {
    setView,
    requestHikes,
    requestingHikes,
    receiveHikes,
    requestHikeDeletion,
    deleteHike,
    requestHike,
    requestHikeDetails,
    receiveHikeDetails,
    setMap,
    receiveSchedule,
    requestRoute,
    receiveRoute,
    routeUpdated,
    receiveRouteUpdates,
    addWaypoint,
    addStartWaypoint,
    addEndWaypoint,
    requestHikerProfiles,
    receiveHikerProfiles,
    addHikerProfile,
    updateHikerProfile,
    requestHikerProfileDeletion,
    deleteHikerProfile,
};
