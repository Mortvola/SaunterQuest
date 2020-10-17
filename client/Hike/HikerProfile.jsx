import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import { requestHikerProfileDeletion } from '../redux/actions';
import { nvl, formatTime } from '../utilities';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { useHikerProfileDialog } from './HikerProfileDialog';
import IconButton from '../IconButton';

const HikerProfile = ({
  hikeId,
  profile,
  dispatch,
}) => {
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this profile?',
    () => {
      dispatch(requestHikerProfileDeletion(hikeId, profile.id));
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
    <Card>
      <div className="hiker-profile-header">
        <span>
          <IconButton icon="pencil-alt" onClick={showHikerProfileDialog} />
          <IconButton icon="trash" onClick={handleDeleteClick} />
        </span>
      </div>
      <div className="hiker-profile">
        <div>Start Day</div>
        <div>{startDay}</div>
        <div>End Day</div>
        <div>{endDay}</div>
        <div>Pace Factor</div>
        <div>{nvl(profile.speedFactor, '')}</div>
        <div>Start Time</div>
        <div>{formatTime(nvl(profile.startTime * 60, ''))}</div>
        <div>End Time</div>
        <div>{formatTime(nvl(profile.endTime * 60, ''))}</div>
        <div>Break Duration</div>
        <div>{nvl(profile.breakDuration, '')}</div>
        <div>End of Day Extension</div>
        <div>{nvl(profile.endDayExtension, '')}</div>
      </div>
      <HikerProfilDialog hikeId={hikeId} profile={profile} />
      <DeleteConfirmation />
    </Card>
  );
};

HikerProfile.propTypes = {
  hikeId: PropTypes.number.isRequired,
  profile: PropTypes.shape().isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default HikerProfile;
