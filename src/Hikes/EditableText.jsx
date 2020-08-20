import React, { useState } from 'react';
import PropTypes from 'prop-types';

const EditableText = ({
    defaultValue,
    url,
    prop,
}) => {
    const [value, setValue] = useState(defaultValue);
    const [editing, setEditing] = useState(false);

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    const handleClick = () => {
        setEditing(true);
    };

    const handleSave = () => {
        fetch(url, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ [prop]: value }),
        })
            .then(() => {
                setEditing(false);
            });
    };

    const handleCancel = () => {
        setEditing(false);
    };

    return (
        <div className="edit-hike-name">
            {
                editing
                    ? (
                        <div
                            style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr min-content min-content' }}
                        >
                            <input
                                type="text"
                                style={{ width: '100%', borderWidth: '2px', borderStyle: 'solid' }}
                                value={value}
                                onChange={handleChange}
                            />
                            <button className="btn btn-sm" type="button" onClick={handleSave}>
                                <i className="fas fa-check-square" />
                            </button>
                            <button className="btn btn-sm" type="button" onClick={handleCancel}>
                                <i className="fas fa-window-close" />
                            </button>
                        </div>
                    )
                    : (
                        <>
                            {value}
                            <div className="btn btn-sm" onClick={handleClick}>
                                <i className="fas fa-pencil-alt" style={{ color: 'rgba(0,0,0,0.4)' }} />
                            </div>
                        </>
                    )
            }
        </div>
    );
};

EditableText.propTypes = {
    defaultValue: PropTypes.string,
    url: PropTypes.string.isRequired,
    prop: PropTypes.string.isRequired,
};

EditableText.defaultProps = {
    defaultValue: null,
};

export default EditableText;
