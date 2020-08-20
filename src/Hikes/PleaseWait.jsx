import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from 'react-bootstrap';

const PleaseWait = ({
    show,
}) => {
    if (show) {
        return (
            <div className="map-please-wait">
                <Spinner animation="border" />
            </div>
        );
    }

    return null;
};

PleaseWait.propTypes = {
    show: PropTypes.bool.isRequired,
};

export default PleaseWait;
