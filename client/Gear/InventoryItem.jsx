import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    useFormikContext,
    Formik,
    Form,
    Field,
} from 'formik';
import { useDrag } from 'react-dnd';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import {
    receiveGearInventoryItem,
    deleteGearInventoryItem,
} from '../redux/actions';

function shallowEqual(object1, object2) {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    return !keys1.some((key) => (
        object1[key] !== object2[key]
    ));
}

const AutoSubmit = () => {
    const { initialValues, values, submitForm } = useFormikContext();
    const [timeoutID, setTimeoutID] = useState(null);

    React.useEffect(() => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }

        setTimeoutID(setTimeout(() => {
            if (!shallowEqual(values, initialValues)) {
                submitForm();
            }
        }, 3000));
    }, [values, submitForm]);

    return null;
};

const InventoryItem = React.forwardRef(({
    item,
    dispatch,
}, forwardRef) => {
    const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
        'Are you sure you want to delete this inventory item?',
        () => {
            if (item.id >= 0) {
                fetch(`/gear/item/${item.id}`, {
                    method: 'DELETE',
                    headers:
                        {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        },
                })
                    .then((response) => {
                        if (response.ok) {
                            dispatch(deleteGearInventoryItem(item.id));
                        }
                    });
            }
            else {
                dispatch(deleteGearInventoryItem(item.id));
            }
        },
    );
    const [, drag] = useDrag({
        item: { type: 'gear-item', itemId: item.id },
    });

    const handleSubmit = async (values) => {
        let method = 'POST';
        let url = '/gear/item';

        if (item.id >= 0) {
            method = 'PUT';
            url = `/gear/item/${item.id}`;
        }

        fetch(url, {
            method,
            headers:
                {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify({ ...values, id: item.id }),
        })
            .then(async (response) => {
                if (response.ok) {
                    dispatch(receiveGearInventoryItem({
                        localId: item.localId, ...await response.json(),
                    }));
                }
            });
    };

    const replaceNulls = (obj) => (
        Object.fromEntries(Object.keys(obj).map((k) => (
            [k, obj[k] === null ? '' : obj[k]]
        )))
    );

    return (
        <Formik
            initialValues={{
                name: '',
                description: '',
                consumable: false,
                system: '',
                weight: '0',
                unitOfMeasure: '',
                ...replaceNulls(item),
            }}
            onSubmit={handleSubmit}
        >
            <Form ref={forwardRef}>
                <div ref={drag} className="gear-item bpp-shadow">
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
                        <div className="gear-item-field gear-number" />
                    </div>
                    <div className="gear-distance gear-config-group">
                        <label className="gear-config-label gear-number">
                            Distance of Use
                        </label>
                        <div className="gear-item-field gear-number" />
                    </div>
                </div>
                <AutoSubmit />
            </Form>
        </Formik>
    );
});

InventoryItem.propTypes = {
    item: PropTypes.shape().isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default InventoryItem;
