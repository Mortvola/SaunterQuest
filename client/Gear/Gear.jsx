/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import Configurations from './Configurations';
import ConfigurationItems from './ConfigurationItems';
import Inventory from './Inventory';
import { useStores } from '../Planner/state/store';

// const mapStateToProps = (state) => ({
//   selectedInventoryItem: state.gear.selectedInventoryItem,
//   configurationId: state.gear.configurationId,
// });

const Gear = ({
  selectedInventoryItem,
}) => {
  const { gear, uiState } = useStores();
  const [initialized, setInitialized] = useState(false);

  if (!initialized) {
    setInitialized(true);
    gear.requestGearInventory();
    gear.requestGearConfigurations();
  }

  let className = 'gear-main';
  if (uiState.selectedGearConfiguration) {
    className += ' selected';
  }

  return (
    <>
      <div className={className}>
        <Configurations />
        <ConfigurationItems />
        <Inventory
          items={gear.inventory}
          selectedItem={selectedInventoryItem}
        />
      </div>

      <datalist id="gear-location">
        <option value="Pack" />
        <option value="Worn" />
      </datalist>
      <datalist id="gear-system" />
    </>
  );
};

Gear.propTypes = {
  selectedInventoryItem: PropTypes.number,
};

Gear.defaultProps = {
  selectedInventoryItem: null,
};

export default observer(Gear);
