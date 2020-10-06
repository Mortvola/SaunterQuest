import { combineReducers } from 'redux';
import {
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    RECEIVE_HIKE_DETAILS,
    DELETE_HIKE,
    SET_VIEW,
    SET_MAP,
    RECEIVE_SCHEDULE,
    RECEIVE_ROUTE,
    RECEIVE_ROUTE_UPDATES,
    RECEIVE_HIKER_PROFILES,
    UPDATE_HIKER_PROFILE,
    DELETE_HIKER_PROFILE,
    ADD_HIKER_PROFILE,
} from './actionTypes';
import { VIEW_HIKES } from '../menuEvents';
import EndOfDayMarker from '../Hike/trailMarker/EndOfDayMarker';

const hike = (
    state = {
        duration: null,
        distance: null,
    },
    action,
) => {
    switch (action.type) {
    case RECEIVE_HIKE_DETAILS: {
        if (action.details) {
            return {
                ...state,
                duration: action.details.duration,
                distance: action.details.distance,
            };
        }

        return state;
    }

    default:
        return state;
    }
};

const hikes = (
    state = {
        requesting: false,
        hikes: [],
    },
    action,
) => {
    switch (action.type) {
    case REQUESTING_HIKES:
        return { ...state, requesting: action.requesting };

    case RECEIVE_HIKES:
        return {
            ...state,
            requesting: false,
            hikes: action.hikes.map((h) => (
                { ...hike(undefined, action), ...h }
            )),
        };

    case DELETE_HIKE: {
        const index = state.hikes.findIndex((h) => h.id === action.id);

        if (index !== -1) {
            return {
                ...state,
                hikes: [
                    ...state.hikes.slice(0, index),
                    ...state.hikes.slice(index + 1),
                ],
            };
        }

        return state;
    }

    default: {
        const index = state.hikes.findIndex((h) => h.id === action.id);

        if (index !== -1) {
            return {
                ...state,
                hikes: [
                    ...state.hikes.slice(0, index),
                    hike(state.hikes[index], action),
                    ...state.hikes.slice(index + 1),
                ],
            };
        }

        return state;
    }
    }
};

function selections(
    state = {
        view: VIEW_HIKES,
        params: null,
    },
    action,
) {
    switch (action.type) {
    case SET_VIEW: {
        return {
            ...state,
            view: action.view,
            params: action.params,
        };
    }

    default:
        return state;
    }
}

function map(
    state = {
        map: null,
        route: null,
        dayMarkers: null,
    },
    action,
) {
    switch (action.type) {
    case SET_MAP:
        return {
            ...state,
            map: action.map,
        };

    case RECEIVE_ROUTE:
        return {
            ...state,
            route: action.route,
        };

    case RECEIVE_ROUTE_UPDATES:
        state.route.applyUpdates(action.updates);

        return state;

    case RECEIVE_SCHEDULE:
        if (state.map) {
            return {
                ...state,
                dayMarkers: action.schedule.map((d, index) => {
                    const marker = new EndOfDayMarker(
                        state.map, 'moon_pin.png',
                    );

                    marker.setDay(index, d);

                    return marker;
                }),
            }
        }

        return state;

    default:
        return state;
    }
}

function schedule(
    state = [],
    action,
) {
    switch (action.type) {
    case RECEIVE_SCHEDULE:
        return action.schedule;
    default:
        return state;
    }
}

function hikerProfiles(
    state = [],
    action,
) {
    switch (action.type) {
    case RECEIVE_HIKER_PROFILES:
        return action.profiles;

    case ADD_HIKER_PROFILE:
        return [
            ...state,
            action.profile,
        ];

    case UPDATE_HIKER_PROFILE: {
        const index = state.findIndex((p) => p.id === action.profile.id);

        if (index !== -1) {
            return [
                ...state.slice(0, index),
                action.profile,
                ...state.slice(index + 1),
            ];
        }

        return state;
    }

    case DELETE_HIKER_PROFILE: {
        const index = state.findIndex((p) => p.id === action.id);

        if (index !== -1) {
            return [
                ...state.slice(0, index),
                ...state.slice(index + 1),
            ];
        }

        return state;
    }

    default:
        return state;
    }
}

const hikeApp = combineReducers({
    selections,
    hikes,
    map,
    schedule,
    hikerProfiles,
});

export default hikeApp;
