import React, { useState } from 'react';
import HikeDialog from './HikeDialog';
import Hike from './Hike';
import PleaseWait from './PleaseWait';

const Hikes = () => {
    const [initialized, setInitialized] = useState(false);
    const [showHikeDialog, setShowHikeDialog] = useState(false);
    const [hikes, setHikes] = useState(null);
    const [waiting, setWaiting] = useState(false);

    function getHikes() {
        setWaiting(true);

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

                        setHikes(json);
                    }
                }
            })
            .then(() => {
                setWaiting(false);
            })
            .catch((error) => {
                console.log(error);
                setWaiting(false);
            });
    }

    if (!initialized) {
        setInitialized(true);
        getHikes();
    }

    const handleClick = () => {
        setShowHikeDialog(true);
    };

    const handleHide = () => {
        setShowHikeDialog(false);
    };

    const handleDelete = (id) => {
        const index = hikes.findIndex((h) => h.id === id);

        if (index !== -1) {
            setHikes([
                ...hikes.slice(0, index),
                ...hikes.slice(index + 1),
            ]);
        }
    };

    return (
        <div className="row no-gutters" style={{ height: '100%' }}>
            <div className="col-md-12" style={{ overflowY: 'scroll', height: '100%' }}>
                <h4>
                    Hikes
                    <button type="button" className="btn btn-sm" onClick={handleClick}>
                        <i className="fas fa-plus" />
                    </button>
                </h4>
                <div className="hikes">
                    {
                        hikes
                            ? hikes.map((h) => (
                                <Hike key={h.id} hike={h} onDelete={handleDelete} />
                            ))
                            : null
                    }
                </div>
                <PleaseWait show={waiting} />
            </div>
            <HikeDialog show={showHikeDialog} onHide={handleHide} />
        </div>
    );
};

export default Hikes;
