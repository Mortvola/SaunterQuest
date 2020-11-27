import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { useHikerProfileDialog } from './HikerProfileDialog';
import HikerProfile from './HikerProfile';
import IconButton from '../IconButton';

const HikerProfiles = ({
  hike,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      hike.requestHikerProfiles();
    }
  }, [hike]);

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

HikerProfiles.propTypes = {
  hike: PropTypes.shape().isRequired,
};

export default observer(HikerProfiles);
