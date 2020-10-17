import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { requestHikerProfiles } from '../redux/actions';
import { useHikerProfileDialog } from './HikerProfileDialog';
import HikerProfile from './HikerProfile';
import IconButton from '../IconButton';

const mapStateToProps = (state) => ({
  profiles: state.hikerProfiles,
});

const HikerProfiles = ({
  hikeId,
  profiles,
  dispatch,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [HikerProfilDialog, showHikerProfileDialog] = useHikerProfileDialog();

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      dispatch(requestHikerProfiles(hikeId));
    }
  }, [profiles]);

  return (
    <div>
      <div>
        {
          profiles
            ? profiles.map((p) => (
              <HikerProfile
                key={p.id}
                hikeId={hikeId}
                profile={p}
                dispatch={dispatch}
              />
            ))
            : null
        }
        <IconButton icon="plus" onClick={showHikerProfileDialog} />
      </div>
      <HikerProfilDialog hikeId={hikeId} />
    </div>
  );
};

HikerProfiles.propTypes = {
  hikeId: PropTypes.number.isRequired,
  profiles: PropTypes.arrayOf(PropTypes.shape()),
  dispatch: PropTypes.func.isRequired,
};

HikerProfiles.defaultProps = {
  profiles: [],
};

export default connect(mapStateToProps)(HikerProfiles);
