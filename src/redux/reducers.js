import { combineReducers } from 'redux';
import {
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    DELETE_HIKE,
} from './actionTypes';

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
        const index = state.findIndex((h) => h.id === action.id);

        if (index !== -1) {
            return {
                ...state,
                hikes: [
                    ...state.slice(0, index),
                    ...state.slice(index + 1),
                ],
            };
        }

        return state;
    }

    default:
        return state;
    }
};

const hikeApp = combineReducers({
    hikes,
});

export default hikeApp;
