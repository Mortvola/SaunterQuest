import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import { useDrag } from 'react-dnd';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { useStores } from '../state/store';
import AutoSubmit from './AutoSubmit';

const InventoryItem = React.forwardRef(({
  item,
}, forwardRef) => {
  const { gear } = useStores();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this inventory item?',
    () => {
      if (item.id >= 0) {
        item.delete();
      }
      else {
        gear.removeItem(item.id);
      }
    },
  );
  const [{ dragClass }, dragRef] = useDrag(
    () => ({
      type: 'gear-item',
      item,
      collect: (monitor) => ({
        dragClass: monitor.isDragging() ? 'drag-source' : '',
      }),
    }),
    [],
  );

  const handleSubmit = async (values) => {
    if (item.id !== null) {
      gear.updateInventoryItem(item, values);
    }
    else {
      gear.addInventoryItem(item, values);
    }
  };

  return (
    <Formik
      initialValues={{
        name: (item.name ? item.name : ''),
        description: (item.description ? item.description : ''),
        consumable: (item.consumable ? item.consumable : false),
        system: (item.system ? item.system : ''),
        weight: (item.weight ? item.weight : 0),
        unitOfMeasure: (item.unitOfMeasure ? item.unitOfMeasure : ''),
      }}
      onSubmit={handleSubmit}
    >
      <Form ref={forwardRef}>
        <div ref={dragRef} className="gear-item bpp-shadow">
          <div className="gear-name gear-config-group">
            <label className="gear-config-label">
              Name
            </label>
            <Field type="text" name="name" placeholder="Name" className="gear-item-field" />
          </div>
          <div className="gear-system gear-config-group">
            <label className="gear-config-label">
              System
            </label>
            <Field type="text" name="system" placeholder="System" list="gear-system" className="dyna-list" />
          </div>
          <div className="gear-consumable gear-config-check-group">
            <label className="gear-config-check-label checkbox-label">
              <Field type="checkbox" name="consumable" />
              Consumable
            </label>
          </div>
          <div className="gear-description gear-config-group">
            <label className="gear-config-label">
              Description
            </label>
            <Field type="text" name="description" placeholder="Description" className="gear-item-field" />
          </div>
          <IconButton className="gear-delete" icon="trash-alt" onClick={handleDeleteClick} />
          <DeleteConfirmation />
          <div className="gear-weight gear-config-group">
            <label className="gear-config-label gear-number">
              Weight
            </label>
            <div className="gear-weight-input">
              <Field
                style={{ minWidth: 0 }}
                type="text"
                name="weight"
                placeholder="Weight"
                className="gear-number gear-item-field"
              />
              <Field as="select" className="uofm-select gear-item-field" name="unitOfMeasure">
                <option value="oz">oz</option>
                <option value="lb">lb</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </Field>
            </div>
          </div>
          <div className="gear-days gear-config-group">
            <label className="gear-config-label gear-number">
              Days of Use
            </label>
            <div className="gear-item-field gear-number">0</div>
          </div>
          <div className="gear-distance gear-config-group">
            <label className="gear-config-label gear-number">
              Distance of Use
            </label>
            <div className="gear-item-field gear-number">0</div>
          </div>
        </div>
        <AutoSubmit />
      </Form>
    </Formik>
  );
});

InventoryItem.displayName = 'InventoryItem';

InventoryItem.propTypes = {
  item: PropTypes.shape().isRequired,
};

export default InventoryItem;
