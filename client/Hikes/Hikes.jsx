import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { observer } from 'mobx-react-lite';
import HikeDialog from './HikeDialog';
import Hike from './Hike';
import PleaseWait from './PleaseWait';

const mapStateToProps = (state) => ({
  hikes: state.hikes,
});

const Hikes = ({
  hikes,
  dispatch,
}) => {
  const [showHikeDialog, setShowHikeDialog] = useState(false);

  const handleClick = () => {
    setShowHikeDialog(true);
  };

  const handleHide = () => {
    setShowHikeDialog(false);
  };

  const handleDelete = (id) => {
    hikes.deleteHike(id);
  };

  return (
    <>
      <div className="row no-gutters" style={{ height: '100%' }}>
        <div className="col-md-12" style={{ overflowY: 'scroll', height: '100%' }}>
          <h4>
            Hikes
            <button type="button" className="btn btn-sm" onClick={handleClick}>
              <i className="fas fa-plus" />
            </button>
          </h4>
          <div className="hikes">
            {
              hikes.hikes.map((h) => (
                <Hike
                  key={h.id}
                  hike={h}
                  onDelete={handleDelete}
                  dispatch={dispatch}
                />
              ))
            }
          </div>
          <PleaseWait show={hikes.requesting} />
        </div>
      </div>
      <HikeDialog show={showHikeDialog} onHide={handleHide} dispatch={dispatch} />
    </>
  );
};

Hikes.propTypes = {
  hikes: PropTypes.shape(),
  dispatch: PropTypes.func,
};

Hikes.defaultProps = {
  hikes: null,
  dispatch: null,
};

export default connect(mapStateToProps)(observer(Hikes));
