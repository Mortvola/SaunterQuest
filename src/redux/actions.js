import {
    REQUESTING_HIKES,
    RECEIVE_HIKES,
    DELETE_HIKE,
} from './actionTypes';

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
            .then(() => {
                dispatch(deleteHike(id));
            });
    }
);

export {
    requestHikes,
    requestHikeDeletion,
}