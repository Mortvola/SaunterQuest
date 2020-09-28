import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import ConfigurationItem from './ConfigurationItem';
import IconButton from '../IconButton';
import { addConfigurationItem } from '../redux/actions';

const mapStateToProps = (state) => {
    let configuration = null;
    if (state.gear.configurationId >= 0) {
        configuration = state.gear.configurations.find(
            (c) => c.id === state.gear.configurationId,
        );
    }

    return {
        configId: state.gear.configurationId,
        configName: configuration
            ? configuration.name
            : '',
        items: state.gear.configurationItems,
    };
};

const ConfigurationItems = ({
    configId,
    configName,
    items,
    dispatch,
}) => {
    const [, dropRef] = useDrop({
        accept: 'gear-item',
        drop(item) {
            dispatch(addConfigurationItem(configId, item.itemId));
        },
    });

    const handleClick = () => {
    };

    return (
        <div className="gear-config-items">
            <div className="gear-kits-title">
                {`Items for ${configName}`}
                <IconButton icon="plus" invert onClick={handleClick} />
            </div>
            <div ref={dropRef} className="gear-configuration-items">
                {
                    items
                        ? items.map((i) => (
                            <ConfigurationItem key={i.id} item={i} dispatch={dispatch} />
                        ))
                        : null
                }
            </div>
        </div>
    );
};

ConfigurationItems.propTypes = {
    configId: PropTypes.number.isRequired,
    configName: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape()),
    dispatch: PropTypes.func.isRequired,
};

ConfigurationItems.defaultProps = {
    items: null,
};

export default connect(mapStateToProps)(ConfigurationItems);
