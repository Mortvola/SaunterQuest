import React from 'react';
import { observer } from 'mobx-react-lite';
import Configuration from './Configuration';
import IconButton from '../IconButton';
import { useStores } from '../state/store';

const Configurations = () => {
  const { gear } = useStores();
  const handleClick = () => {
    gear.addGearConfiguration();
  };

  return (
    <div className="gear-configurations">
      <div className="gear-kits-title">
        Gear Configurations
        <IconButton icon="plus" invert onClick={handleClick} />
      </div>
      <div className="gear-kits" id="gear-kits">
        {
          gear.configurations.map((config) => (
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

export default observer(Configurations);
