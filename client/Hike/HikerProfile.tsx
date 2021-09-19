import React, { ReactElement } from 'react';
import { Card } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { HikeInterface, HikerProfileInterface } from '../state/Types';
import { nvl, formatTime } from '../utilities';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { useHikerProfileDialog } from './HikerProfileDialog';
import IconButton from '../IconButton';

type PropsType = {
  hike: HikeInterface,
  profile: HikerProfileInterface,
}

const HikerProfile = ({
  hike,
  profile,
}: PropsType): ReactElement => {
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this profile?',
    () => {
      if (profile.id === null) {
        throw new Error('hiker profile id is null');
      }

      hike.deleteHikerProfile(profile.id);
    },
  );

  // fixup start day.
  let startDay = nvl(profile.startDay, '');

  if (typeof startDay === 'string' && startDay !== '') {
    startDay = parseInt(startDay, 10) + 1;
  }

  // fixup end day
  let endDay = nvl(profile.endDay, '');

  if (typeof endDay === 'string' && endDay !== '') {
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
        <div>{formatTime(profile.startTime !== null ? profile.startTime * 60 : 0)}</div>
        <div>End Time</div>
        <div>{formatTime(profile.endTime !== null ? profile.endTime * 60 : 0)}</div>
        <div>Break Duration</div>
        <div>{nvl(profile.breakDuration, '')}</div>
        <div>End of Day Extension</div>
        <div>{nvl(profile.endDayExtension, '')}</div>
      </div>
      <HikerProfilDialog hike={hike} profile={profile} />
      <DeleteConfirmation />
    </Card>
  );
};

export default observer(HikerProfile);
