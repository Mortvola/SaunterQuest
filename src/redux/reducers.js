import { combineReducers } from 'redux';
import {
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    DELETE_HIKE,
    SET_VIEW,
    SET_MAP,
    RECEIVE_SCHEDULE,
    RECEIVE_ROUTE,
    RECEIVE_ROUTE_UPDATES,
} from './actionTypes';
import { VIEW_HIKES } from '../menuEvents';

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
        return { ...state, requesting: false, hikes: action.hikes };

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

    default:
        return state;
    }
};

function selections(
    state = {
        view: VIEW_HIKES,
    },
    action,
) {
    switch (action.type) {
    case SET_VIEW:
        return {
            ...state,
            view: action.view,
        };

    default:
        return state;
    }
}

function map(
    state = {
        map: null,
        route: null,
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

const hikeApp = combineReducers({
    selections,
    hikes,
    map,
    schedule,
});

export default hikeApp;
