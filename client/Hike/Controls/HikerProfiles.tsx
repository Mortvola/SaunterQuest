import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useHikerProfileDialog } from './HikerProfileDialog';
import HikerProfile from './HikerProfile';
import IconButton from '../../IconButton';
import { HikeLegInterface } from '../../state/Types';

type PropsType = {
  hikeLeg: HikeLegInterface,
}

const HikerProfiles = observer(({
  hikeLeg,
}: PropsType) => {
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();

  return (
    <div className="profiles">
      <div>
        Add Profile
        <IconButton icon="plus" onClick={showHikerProfileDialog} />
      </div>
      <div className="profile-list">
        {
          hikeLeg.hikerProfiles.length
            ? hikeLeg.hikerProfiles.map((p) => (
              <HikerProfile
                key={p.id}
                hikeLeg={hikeLeg}
                profile={p}
              />
            ))
            : null
        }
      </div>
      <HikerProfilDialog hikeLeg={hikeLeg} />
    </div>
  );
});

export default HikerProfiles;
