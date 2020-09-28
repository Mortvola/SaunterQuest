import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import InventoryItem from './InventoryItem';
import IconButton from '../IconButton';
import { useUploadInventoryDialog } from './UploadInventoryDialog';
import { addNewGearInventoryItem } from '../redux/actions';

const Inventory = ({
    items,
    selectedItem,
    dispatch,
}) => {
    const selectedRef = useRef(null);
    const [UploadInventoryDialog, showDialogModal] = useUploadInventoryDialog();

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    const handleAddClick = () => {
        dispatch(addNewGearInventoryItem());
    };

    return (
        <div className="gear-inventory">
            <div className="gear-kits-title">
                Inventory
                <IconButton icon="plus" invert onClick={handleAddClick} />
                <IconButton icon="file-upload" invert onClick={showDialogModal} />
            </div>
            <div className="gear-inventory-items">
                {
                    items.map((i) => (
                        <InventoryItem
                            key={i.localId || i.id}
                            ref={selectedItem === (i.localid || i.id) ? selectedRef : null}
                            item={i}
                            dispatch={dispatch}
                        />
                    ))
                }
            </div>
            <UploadInventoryDialog />
        </div>
    );
};

Inventory.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape()),
    selectedItem: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
};

Inventory.defaultProps = {
    items: [],
    selectedItem: null,
};

export default Inventory;
