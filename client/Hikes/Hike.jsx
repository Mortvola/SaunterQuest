import React from 'react';
import PropTypes from 'prop-types';
import { metersToMilesRounded } from '../utilities';
import EditableText from './EditableText';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { requestHike } from '../redux/actions';

const Hike = ({
    hike,
    onDelete,
    dispatch,
}) => {
    const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
        'Are you sure you want to delete this hike?',
        () => {
            onDelete(hike.id);
        },
    );

    return (
        <div
            className="card bpp-shadow mr-4 mb-4 flex-shrink-0 flex-grow-0"
            style={{ width: '250px' }}
        >
            <div className="hike-card-header card-header">
                <EditableText
                    defaultValue={hike.name}
                    url={`hike/${hike.id}`}
                    prop="name"
                />
            </div>
            <div className="card-body">
                <div />
                <div>
                    {`Distance: ${metersToMilesRounded(hike.distance)} miles`}
                </div>
                <div>
                    {`Duration: ${hike.days} days`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleDeleteClick}
                    >
                        Delete
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                            dispatch(requestHike(hike.id));
                        }}
                    >
                        Open
                    </button>
                </div>
            </div>
            <DeleteConfirmation />
        </div>
    );
};

Hike.propTypes = {
    hike: PropTypes.shape().isRequired,
    onDelete: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default Hike;
