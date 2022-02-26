import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import InventoryItem from './InventoryItem';
import IconButton from '../IconButton';
import { useUploadInventoryDialog } from './UploadInventoryDialog';
import { useStores } from '../Planner/state/store';
import DropDownChecks from './DropDownChecks';

const Inventory = ({
  items,
  selectedItem,
}) => {
  const { gear, uiState } = useStores();
  const selectedRef = useRef(null);
  const [UploadInventoryDialog, showDialogModal] = useUploadInventoryDialog();
  const [hideUsed, setHideUsed] = useState(false);
  const [newItems, setNewItems] = useState([]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const handleAddClick = () => {
    const newItem = gear.addNewGearInventoryItem();
    setNewItems([...newItems, newItem]);
  };

  const handleHideUsedChange = (event) => {
    setHideUsed(event.target.checked);
  };

  const handleFilterChange = (key, value) => {
    setNewItems([]);
    runInAction(() => {
      gear.systems.set(key, value);
    });
  };

  return (
    <div className="gear-inventory">
      <div className="gear-kits-title">
        Inventory
        <IconButton icon="plus" invert onClick={handleAddClick} />
        <IconButton icon="file-upload" invert onClick={showDialogModal} />
        <input type="checkbox" checked={hideUsed} onChange={handleHideUsedChange} />
        <div style={{ margin: '0 3px' }}>
          <DropDownChecks items={gear.systems} onChange={handleFilterChange}>
            Systems
          </DropDownChecks>
        </div>
      </div>
      <div className="gear-inventory-items">
        {
          items.map((i) => {
            if (
              newItems.includes(i)
              || ((
                !hideUsed
                || uiState.selectedGearConfiguration === null
                || !uiState.selectedGearConfiguration.items.some((gci) => gci.gearItem.id === i.id)
              )
              && gear.systems.get(i.system))
            ) {
              return (
                <InventoryItem
                  key={i.localId || i.id}
                  ref={selectedItem === (i.localid || i.id) ? selectedRef : null}
                  item={i}
                />
              );
            }

            return null;
          })
        }
      </div>
      <UploadInventoryDialog />
    </div>
  );
};

Inventory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape()),
  selectedItem: PropTypes.number,
};

Inventory.defaultProps = {
  items: [],
  selectedItem: null,
};

export default observer(Inventory);
