import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useHikerProfileDialog } from './HikerProfileDialog';
import HikerProfile from './HikerProfile';
import IconButton from '../IconButton';
import { HikeInterface } from '../state/Types';

type PropsType = {
  hike: HikeInterface,
}

const HikerProfiles = ({
  hike,
}: PropsType) => {
  const [initialized, setInitialized] = useState(false);
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      hike.requestHikerProfiles();
    }
  }, [hike, initialized]);

  return (
    <div className="profiles">
      <div>
        Add Profile
        <IconButton icon="plus" onClick={showHikerProfileDialog} />
      </div>
      <div className="profile-list">
        {
          hike.hikerProfiles.length
            ? hike.hikerProfiles.map((p) => (
              <HikerProfile
                key={p.id}
                hike={hike}
                profile={p}
              />
            ))
            : null
        }
      </div>
      <HikerProfilDialog hike={hike} />
    </div>
  );
};

export default observer(HikerProfiles);
