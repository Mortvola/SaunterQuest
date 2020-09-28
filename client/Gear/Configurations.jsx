import React from 'react';
import PropTypes from 'prop-types';
import Configuration from './Configuration';
import IconButton from '../IconButton';

const Configurations = ({
    configurations,
    selected,
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
                            selected={selected === config.id}
                        />
                    ))
                }
            </div>
        </div>
    );
};

Configurations.propTypes = {
    configurations: PropTypes.arrayOf(PropTypes.shape()),
    selected: PropTypes.number,
};

Configurations.defaultProps = {
    configurations: [],
    selected: null,
};

export default Configurations;
