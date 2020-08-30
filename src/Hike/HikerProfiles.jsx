import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { requestHikerProfiles, requestHikerProfileDeletion } from '../redux/actions';
import { nvl, formatTime } from '../utilities';
import { useHikerProfileDialog } from './HikerProfileDialog';
import { useDeleteConfirmation } from '../DeleteConfirmation';

const HikerProfile = ({
    profile,
    dispatch,
}) => {
    const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog(profile);
    const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
        'Are you sure you want to delete this profile?',
        () => {
            dispatch(requestHikerProfileDeletion(profile.id));
        },
    );

    // fixup start day.
    let startDay = nvl(profile.startDay, '');

    if (startDay !== '') {
        startDay = parseInt(startDay, 10) + 1;
    }

    // fixup end day
    let endDay = nvl(profile.endDay, '');

    if (endDay !== '') {
        endDay = parseInt(endDay, 10) + 1;
    }

    return (
        <tr>
            <td style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                    <a className='btn btn-sm' style={{ padding: '5px 5px 5px 5px' }} onClick={showHikerProfileDialog}>
                        <i className='fas fa-pencil-alt' />
                    </a>
                    <a className='btn btn-sm' style={{ padding: '5px 5px 5px 5px' }} onClick={handleDeleteClick}>
                        <i className='fas fa-trash-alt' />
                    </a>
                </span>
                {startDay}
            </td>
            <td style={{ textAlign: 'right' }}>{endDay}</td>
            <td style={{ textAlign: 'right' }}>{nvl(profile.speedFactor, '')}</td>
            <td style={{ textAlign: 'right' }}>{formatTime(nvl(profile.startTime * 60, ''))}</td>
            <td style={{ textAlign: 'right' }}>{formatTime(nvl(profile.endTime * 60, ''))}</td>
            <td style={{ textAlign: 'right' }}>{nvl(profile.breakDuration, '')}</td>
            <HikerProfilDialog />
            <DeleteConfirmation />
        </tr>
    );
};

HikerProfile.propTypes = {
    profile: PropTypes.shape().isRequired,
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
    profiles: state.hikerProfiles,
});

const HikerProfiles = ({
    profiles,
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);
    const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog(null);

    if (!initialized) {
        setInitialized(true);
        dispatch(requestHikerProfiles());
    }

    return (
        <table className="table table-condensed">
            <thead>
                <tr>
                    <th style={{ textAlign: 'right' }}>
                        Start
                        <br />
                        Day
                    </th>
                    <th style={{ textAlign: 'right' }}>
                        End
                        <br />
                        Day
                    </th>
                    <th style={{ textAlign: 'right' }}>
                        Pace
                        <br />
                        Factor
                    </th>
                    <th style={{ textAlign: 'right' }}>
                        Start
                        <br />
                        Time
                    </th>
                    <th style={{ textAlign: 'right' }}>
                        End
                        <br />
                        Time
                    </th>
                    <th style={{ textAlign: 'right' }}>
                        Break
                        <br />
                        Duration
                    </th>
                </tr>
            </thead>
            <tbody id="hikerProfilesTable">
                {
                    profiles.map((p) => <HikerProfile key={p.id} profile={p} dispatch={dispatch} />)
                }
                <tr id="hikerProfileLastRow">
                    <td>
                        <button type="button" className="btn btn-sm" onClick={showHikerProfileDialog}>
                            <i className="fas fa-plus" />
                        </button>
                    </td>
                </tr>
            </tbody>
            <HikerProfilDialog />
        </table>
    );
};

HikerProfiles.propTypes = {
    profiles: PropTypes.arrayOf(PropTypes.shape()),
    dispatch: PropTypes.func.isRequired,
};

HikerProfiles.defaultProps = {
    profiles: [],
};

export default connect(mapStateToProps)(HikerProfiles);
