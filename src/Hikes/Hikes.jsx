import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import HikeDialog from './HikeDialog';
import Hike from './Hike';
import PleaseWait from './PleaseWait';
import { requestHikes, requestHikeDeletion } from '../redux/actions';

const mapStateToProps = (state) => ({
    hikes: state.hikes.hikes,
    requesting: state.hikes.requesting,
});

const Hikes = ({
    hikes,
    requesting,
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);
    const [showHikeDialog, setShowHikeDialog] = useState(false);

    if (!initialized) {
        setInitialized(true);
        dispatch(requestHikes());
    }

    const handleClick = () => {
        setShowHikeDialog(true);
    };

    const handleHide = () => {
        setShowHikeDialog(false);
    };

    const handleDelete = (id) => {
        dispatch(requestHikeDeletion(id));
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
                        hikes.map((h) => (
                            <Hike key={h.id} hike={h} onDelete={handleDelete} />
                        ))
                    }
                </div>
                <PleaseWait show={requesting} />
            </div>
            <HikeDialog show={showHikeDialog} onHide={handleHide} />
        </div>
    );
};

Hikes.propTypes = {
    hikes: PropTypes.arrayOf(PropTypes.shape()),
    requesting: PropTypes.bool.isRequired,
    dispatch: PropTypes.func,
};

Hikes.defaultProps = {
    hikes: [],
    dispatch: null,
};

export default connect(mapStateToProps)(Hikes);
