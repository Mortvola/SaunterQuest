import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { showMenu, createConfigItemMenu } from './gear';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { requestGearConfigurationItemDeletion } from '../redux/actions';

const computeWeight = (weight, quantity, unitOfMeasure) => {
    let totalWeight = parseFloat(weight) * parseFloat(quantity);

    switch (unitOfMeasure) {
    case 'oz':
        totalWeight *= 0.0625;
        break;

    case 'g':
        totalWeight *= 0.0022;
        break;

    case 'kg':
        totalWeight *= 2.20462;
        break;
    default:
        break;
    }

    return totalWeight;
};

const computeItemWeight = (item) => computeWeight(
    item.gear_item.weight, item.quantity, item.gear_item.unitOfMeasure,
);

const ConfigurationItem = ({
    item,
    dispatch,
}) => {
    const [weight, setWeight] = useState(item.gear_item.weight);
    const [quantity, setQuantity] = useState(item.quantity);
    const [unitOfMeasure, setUnitOfMeasure] = useState(item.gear_item.unitOfMeasure);
    const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
        'Are you sure you want to delete this configuration item?',
        () => {
            dispatch(requestGearConfigurationItemDeletion(item.id));
        },
    );

    const handleClick = (event) => {
        showMenu.call(
            $(this), event, createConfigItemMenu, item,
            { left: $(this).offset().left, top: $(this).offset().top + $(this).outerHeight() },
        );
    };

    const handleWeightChange = (event) => {
        setWeight(event.target.value);
    };

    const handleQuantityChange = (event) => {
        setQuantity(event.target.value);
    };

    const handleUnitOfMeasureChange = (event) => {
        setUnitOfMeasure(event.target.value);
    };

    const totalWeight = computeWeight(weight, quantity, unitOfMeasure);

    return (
        <div className="gear-config-item bpp-shadow">
            <i
                className="fas fa-caret-down"
                style={{ alignSelf: 'center' }}
                onClick={handleClick}
            />
            <div className="gear-name gear-config-group">
                <label className="gear-config-label">Item</label>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    defaultValue={item.gear_item.name}
                    className="gear-item-field"
                    readOnly
                />
            </div>
            <div className="gear-system gear-config-group">
                <label className="gear-config-label">System</label>
                <input
                    type="text"
                    name="system"
                    placeholder="System"
                    list="gear-system"
                    className="dyna-list gear-item-field"
                    defaultValue={item.gear_item.system}
                    readOnly
                />
            </div>
            <div className="gear-config-misc">
                <div className="gear-config-consumable gear-config-check-group">
                    <label className="gear-config-check-label checkbox-label">
                        <input
                            type="checkbox"
                            name="consumable"
                            className="gear-item-field"
                            defaultChecked={item.gear_item.consumable}
                            readOnly
                        />
                        Consumable
                    </label>
                </div>
                <div className="gear-config-location gear-config-check-group">
                    <label className="gear-config-check-label checkbox-label">
                        <input
                            type="checkbox"
                            name="worn"
                            className="gear-item-field"
                            defaultChecked={item.gear_item.worn}
                            readOnly
                        />
                        Worn
                    </label>
                </div>
            </div>
            <div className="gear-config-description gear-config-group">
                <label className="gear-config-label">Description</label>
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    defaultValue={item.gear_item.description}
                    className="gear-item-field"
                    readOnly
                />
            </div>
            <div className="gear-weight gear-config-group">
                <label className="gear-config-label gear-number">Weight</label>
                <input
                    type="text"
                    name="weight"
                    placeholder="Weight"
                    className="gear-number gear-item-field"
                    style={{ minWidth: '0' }}
                    value={`${weight} ${unitOfMeasure}`}
                    onChange={handleWeightChange}
                    readOnly
                />
                <select
                    name="unitOfMeasure"
                    className="uofm-select gear-item-field"
                    value={unitOfMeasure}
                    onChange={handleUnitOfMeasureChange}
                >
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                </select>
                <div className="uofm-text" />
            </div>
            <IconButton className="gear-configuration-delete" icon="trash-alt" onClick={handleDeleteClick} />
            <DeleteConfirmation />
            <div className="gear-config-quantity gear-config-group">
                <label className="gear-config-label gear-number">Quantity</label>
                <input
                    type="text"
                    min="0"
                    name="quantity"
                    placeholder="Quantity"
                    className="gear-number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    readOnly
                />
            </div>
            <div className="gear-config-total-weight gear-config-group">
                <label className="gear-config-label gear-number">Total Weight</label>
                <div className="gear-config-total-weight-value gear-number">
                    {`${totalWeight.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 4, minimumFractionDigits: 4 },
                    )} lbs`}
                </div>
            </div>
        </div>
    );

    // $.extend(item, {
    //     delayedSave() {
    //         delayedSave(item, () => {
    //             saveConfigItem(item);
    //         });
    //     },
    // });

    // item.find(':input').first().on('keydown', reverseTabEventHandler);

    // item.find(':input').last().on('keydown', () => {
    //     forwardTabEventHandler(event, item, () => {
    //         const nextRow = newGearConfigItemRow(item.data('configId'));
    //         item.after(nextRow);

    //         return nextRow;
    //     });
    // });

    // item.find('.dyna-list').on('blur', updateList);
    // item.find('[name]').on('input', () => {
    //     item.delayedSave();
    // });

    // item.find('.gear-item-field').on('input', () => {
    //     if (item.data('gearItemId') !== undefined) {
    //         const record = getNamedValues(item);
    //         record.id = item.data('gearItemId');

    //         $('.gear-item').trigger('gearItemUpdated', record);
    //     }
    // });

    // item.on('gearItemDeleted', (_event, gearItemId) => {
    //     if (item.data('gearItemId') === gearItemId) {
    //         deleteConfigItem(item);
    //     }
    // });

    // item.on('gearItemUpdated', function (_event, gearItem) {
    //     if (gearItem.id !== undefined && gearItem.id === item.data('gearItemId')) {
    //         const entries = Object.entries(gearItem);

    //         for (const [prop, value] of entries) {
    //             $(this).find(`.gear-item-field[name="${prop}"]`).val(value);
    //         }

    //         item.computeWeight();
    //         item.find('.uofm-text').text(gearItem.unitOfMeasure);
    //     }
    // });
};

ConfigurationItem.propTypes = {
    item: PropTypes.shape().isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default ConfigurationItem;
export {
    computeItemWeight,
};
