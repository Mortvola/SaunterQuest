import React from 'react';
import { Card } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { HikeLegInterface, HikerProfileInterface } from '../../state/Types';
import { nvl, formatTime, metersToMiles } from '../../utilities';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import { useHikerProfileDialog } from './HikerProfileDialog';
import IconButton from '../../IconButton';

type PropsType = {
  hikeLeg: HikeLegInterface,
  profile: HikerProfileInterface,
}

const HikerProfile: React.FC<PropsType> = observer(({
  hikeLeg,
  profile,
}) => {
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this profile?',
    () => {
      if (profile.id === null) {
        throw new Error('hiker profile id is null');
      }

      hikeLeg.deleteHikerProfile(profile.id);
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
        <div>Miles Per Hour</div>
        <div>{metersToMiles(profile?.metersPerHour ?? 0).toFixed(2)}</div>
        <div>Start Day</div>
        <div>{startDay}</div>
        <div>End Day</div>
        <div>{endDay}</div>
        <div>Start Time</div>
        <div>{formatTime(profile.startTime !== null ? profile.startTime * 60 : 0)}</div>
        <div>End Time</div>
        <div>{formatTime(profile.endTime !== null ? profile.endTime * 60 : 0)}</div>
        <div>Break Duration</div>
        <div>{nvl(profile.breakDuration, '')}</div>
        <div>End of Day Extension</div>
        <div>{nvl(profile.endDayExtension, '')}</div>
      </div>
      <HikerProfilDialog hikeLeg={hikeLeg} profile={profile} />
      <DeleteConfirmation />
    </Card>
  );
});

export default HikerProfile;
