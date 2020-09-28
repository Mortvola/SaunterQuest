/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
    requestGearConfigurations,
    requestGearInventory,
} from '../redux/actions';
import Configurations from './Configurations';
import ConfigurationItems from './ConfigurationItems';
import Inventory from './Inventory';

const mapStateToProps = (state) => ({
    inventory: state.gear.inventory,
    selectedInventoryItem: state.gear.selectedInventoryItem,
    configurations: state.gear.configurations,
    configurationId: state.gear.configurationId,
});

const Gear = ({
    inventory,
    selectedInventoryItem,
    configurations,
    configurationId,
    dispatch,
}) => {
    const [initialized, setInitialized] = useState(false);

    if (!initialized) {
        setInitialized(true);
        dispatch(requestGearInventory());
        dispatch(requestGearConfigurations());
    }

    return (
        <>
            <div className={`gear-main ${configurationId ? 'selected' : null}`}>
                <Configurations
                    configurations={configurations}
                    selected={configurationId}
                />
                {
                    configurationId ? <ConfigurationItems /> : null
                }
                <Inventory
                    items={inventory}
                    selectedItem={selectedInventoryItem}
                    dispatch={dispatch}
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
    inventory: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    selectedInventoryItem: PropTypes.number,
    configurations: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    configurationId: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
};

Gear.defaultProps = {
    selectedInventoryItem: null,
    configurationId: null,
};

export default connect(mapStateToProps)(Gear);
