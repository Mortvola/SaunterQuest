import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import EditableText from '../Hikes/EditableText';
import { computeItemWeight } from './ConfigurationItem';
import { selectGearConfiguration } from '../redux/actions';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';

const Configuration = ({
    configuration,
    selected,
    dispatch,
}) => {
    const [totalPackWeight, setTotalPackWeight] = useState(null);
    const [totalWornWeight, setTotalWornWeight] = useState(null);
    const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
        'Are you sure you want to delete this configuration?',
        () => {
            fetch(`/gear/configuration/${configuration.id}`, {
                method: 'DELETE',
                headers:
                    {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
            })
                .then((response) => {
                    if (response.ok) {
                        $(this).parents('.card').remove();
                    }
                });
        },
    );

    const handleClick = () => {
        if (selected) {
            dispatch(selectGearConfiguration(null));
        }
        else {
            dispatch(selectGearConfiguration(configuration.id));
        }
    };

    if (totalPackWeight === null) {
        if (configuration.gear_configuration_items
            && configuration.gear_configuration_items.length > 0) {
            setTotalPackWeight(
                configuration.gear_configuration_items.reduce(
                    (accumulator, item) => {
                        if (!item.gear_item.worn) {
                            return accumulator + computeItemWeight(item);
                        }

                        return accumulator;
                    },
                    0,
                ),
            );
        }
        else {
            setTotalPackWeight(0);
        }
    }

    if (totalWornWeight === null) {
        if (configuration.gear_configuration_items
            && configuration.gear_configuration_items.length > 0) {
            setTotalWornWeight(
                configuration.gear_configuration_items.reduce(
                    (accumulator, item) => {
                        if (item.gear_item.worn) {
                            return accumulator + computeItemWeight(item);
                        }

                        return accumulator;
                    },
                    0,
                ),
            );
        }
        else {
            setTotalWornWeight(0);
        }
    }

    return (
        <div className={`gear-configuration bpp-shadow ${selected ? 'selected' : null}`} onClick={handleClick}>
            <EditableText
                className="config-title"
                url={`/gear/configuration/${configuration.id}`}
                prop="name"
                style={{ display: 'inline-block', gridArea: 'title' }}
                defaultValue={configuration.name}
            />
            <IconButton className="gear-configuration-delete" icon="trash-alt" onClick={handleDeleteClick} />
            <div className="config-weight pack">
                <div>Pack Weight:</div>
                <div>
                    {
                        totalPackWeight
                            ? totalPackWeight.toLocaleString(
                                undefined,
                                {
                                    maximumFractionDigits: 4,
                                    minimumFractionDigits: 4,
                                },
                            )
                            : 0
                    }
                </div>
            </div>
            <div className="config-weight worn">
                <div>Worn Weight:</div>
                <div>
                    {
                        totalWornWeight
                            ? totalWornWeight.toLocaleString(
                                undefined,
                                {
                                    maximumFractionDigits: 4,
                                    minimumFractionDigits: 4,
                                },
                            )
                            : 0
                    }
                </div>
            </div>
            <DeleteConfirmation />
        </div>
    );

    // if (configuration.gear_configuration_items
    //     && configuration.gear_configuration_items.length > 0) {
    //     configuration.gear_configuration_items.forEach((configItem) => {
    //         let gearItemId;

    //         if (configItem.gear_item) {
    //             gearItemId = configItem.gear_item.id;
    //         }

    //         const row = newGearConfigItemRow(configuration.id, configItem.id, gearItemId);

    //         setNamedValues(row, configItem);

    //         if (configItem.gear_item) {
    //             setNamedValues(row, configItem.gear_item);

    //             row.find('.uofm-text').text(configItem.gear_item.unitOfMeasure);
    //         }

    //         const weight = row.computeWeight();

    //         if (configItem.worn) {
    //             totalWornWeight += weight;
    //         }
    //         else {
    //             totalPackWeight += weight;
    //         }

    //         gearItem.after(row);
    //     });
    // }
    // else {
    //     const nextRow = newGearConfigItemRow(configuration.id);
    //     gearItem.after(nextRow);
    // }

    // collapse.droppable(
    //     {
    //         accept: '.gear-item',
    //         drop(event, ui) {
    //             const row = newGearConfigItemRow(configuration.id, undefined, ui.helper.data('id'));
    //             const record = getNamedValues(ui.helper);

    //             setNamedValues(row, record);

    //             gearItem.after(row);
    //             event.stopPropagation();

    //             row.delayedSave();
    //         },
    //     },
    // );

    // collapse.on('sortreceive');

    // $('#gear-kits').append(card);

    // return card;
};

Configuration.propTypes = {
    configuration: PropTypes.shape().isRequired,
    selected: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
};

Configuration.defaultProps = {
    selected: false,
};

export default connect()(Configuration);
