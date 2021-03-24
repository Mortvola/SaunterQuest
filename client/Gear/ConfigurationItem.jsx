import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { Formik, Form, Field } from 'formik';
// import { showMenu, createConfigItemMenu } from './gear';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { gramsToPoundsAndOunces } from '../utilities';
import AutoSubmit from './AutoSubmit';

const ConfigurationItem = ({
  item,
}) => {
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this configuration item?',
    () => item.delete(),
  );

  const handleSubmit = async (values) => {
    item.update({ worn: values.worn, quantity: parseInt(values.quantity, 10) });
  };

  const unitOfMeasure = item.gearItem.unitOfMeasure ? item.gearItem.unitOfMeasure : 'oz';

  return (
    <Formik
      initialValues={{
        worn: (item.worn ? item.worn : false),
        quantity: (item.quantity ? item.quantity : 1),
      }}
      onSubmit={handleSubmit}
    >
      <Form>
        <div className="gear-config-item bpp-shadow">
          <div className="gear-name gear-config-group">
            <label className="gear-config-label">Item</label>
            <input
              type="text"
              name="name"
              defaultValue={item.gearItem.name}
              className="gear-item-field"
              readOnly
            />
          </div>
          <div className="gear-system gear-config-group">
            <label className="gear-config-label">System</label>
            <input
              type="text"
              name="system"
              list="gear-system"
              className="dyna-list gear-item-field"
              defaultValue={item.gearItem.system}
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
                  defaultChecked={item.gearItem.consumable}
                  disabled
                />
                Consumable
              </label>
            </div>
            <div className="gear-config-location gear-config-check-group">
              <label className="gear-config-check-label checkbox-label">
                <Field
                  type="checkbox"
                  name="worn"
                  className="gear-item-field"
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
              defaultValue={item.gearItem.description}
              className="gear-item-field"
              readOnly
            />
          </div>
          <div className="gear-weight gear-config-group">
            <label className="gear-config-label gear-number">Weight</label>
            <input
              type="text"
              name="weight"
              className="gear-number gear-item-field"
              style={{ minWidth: '0' }}
              defaultValue={`${item.gearItem.weight ? item.gearItem.weight : 0} ${unitOfMeasure}`}
              readOnly
            />
            <div className="uofm-text" />
          </div>
          <IconButton className="gear-configuration-delete" icon="trash-alt" onClick={handleDeleteClick} />
          <DeleteConfirmation />
          <div className="gear-config-quantity gear-config-group">
            <label className="gear-config-label gear-number">Quantity</label>
            <Field
              type="text"
              min="0"
              name="quantity"
              className="gear-number"
            />
          </div>
          <div className="gear-config-total-weight gear-config-group">
            <label className="gear-config-label gear-number">Total Weight</label>
            <div className="gear-config-total-weight-value gear-number">
              {`${gramsToPoundsAndOunces(item.totalGrams())}`}
            </div>
          </div>
        </div>
        <AutoSubmit />
      </Form>
    </Formik>
  );
};

ConfigurationItem.propTypes = {
  item: PropTypes.shape().isRequired,
};

export default observer(ConfigurationItem);
