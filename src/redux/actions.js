import {
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    DELETE_HIKE,
    SET_VIEW,
    SET_MAP,
    RECEIVE_SCHEDULE,
} from './actionTypes';
import {
    VIEW_HIKES,
    VIEW_GEAR,
    VIEW_FOOD,
    MENU_EVENT_KEY_LOGOUT,
} from '../menuEvents';

const setView = (view) => ({
    type: SET_VIEW,
    view,
});

const requestingHikes = (requesting) => ({
    type: REQUESTING_HIKES,
    requesting,
});

const receiveHikes = (hikes) => ({
    type: RECEIVE_HIKES,
    hikes,
});

const requestHikes = () => (
    (dispatch) => {
        dispatch(requestingHikes(true));

        fetch('/hikes')
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

                        dispatch(receiveHikes(json));
                    }
                }
            })
            .then(() => {
                dispatch(requestingHikes(false));
            })
            .catch((error) => {
                console.log(error);
                dispatch(requestingHikes(false));
            });
    }
);

const deleteHike = (id) => ({
    type: DELETE_HIKE,
    id,
});

const requestHikeDeletion = (id) => (
    (dispatch) => {
        fetch(`hike/${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })
            .then((response) => {
                if (response.ok) {
                    dispatch(deleteHike(id));
                }
            });
    }
);

const navigate = (eventKey) => (
    (dispatch) => {
        switch (eventKey) {
        case VIEW_HIKES:
        case VIEW_FOOD:
        case VIEW_GEAR:
        case MENU_EVENT_KEY_LOGOUT:
            dispatch(setView(eventKey));
            break;

        default:
            break;
        }
    }
);

const setMap = (map) => ({
    type: SET_MAP,
    map,
});

const receiveSchedule = (schedule) => ({
    type: RECEIVE_SCHEDULE,
    schedule,
});

const requestSchedule = () => (
    (dispatch) => {
        fetch(`${sessionStorage.getItem('hikeId')}/schedule`)
            .then(async (response) => {
                if (response.ok) {
                    dispatch(receiveSchedule(await response.json()));
                }
            });
    }
);

export {
    setView,
    requestHikes,
    requestHikeDeletion,
    navigate,
    setMap,
    requestSchedule,
};
