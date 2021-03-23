import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import Configuration from './Configuration';
import IconButton from '../IconButton';

const Configurations = ({
  configurations,
}) => {
  const handleClick = () => {
  };

  return (
    <div className="gear-configurations">
      <div className="gear-kits-title">
        Gear Configurations
        <IconButton icon="plus" invert onClick={handleClick} />
      </div>
      <div className="gear-kits" id="gear-kits">
        {
          configurations.map((config) => (
            <Configuration
              key={config.id}
              configuration={config}
            />
          ))
        }
      </div>
    </div>
  );
};

Configurations.propTypes = {
  configurations: PropTypes.arrayOf(PropTypes.shape()),
};

Configurations.defaultProps = {
  configurations: [],
};

export default observer(Configurations);
