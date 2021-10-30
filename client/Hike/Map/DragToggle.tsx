import L from 'leaflet';
import React, { FC, useState } from 'react';
import styles from './DragToggle.module.css';
import LeafletControl from './LeafletControl';

type OnToggleCallback = (locked: boolean) => void;

type PropsType = {
  defaultValue?: boolean,
  onLockToggle: OnToggleCallback,
  position: L.ControlPosition,
}

const DragToggleControl:FC<L.ControlOptions & PropsType> = ({
  defaultValue = false,
  onLockToggle,
  position,
}) => {
  const [locked, setLocked] = useState<boolean>(defaultValue);

  const handleClick = () => {
    setLocked((prev) => {
      const newValue = !prev;
      onLockToggle(newValue);
      return newValue;
    });
  };

  let className = styles.dragToggle;
  if (!locked) {
    className += ` ${styles.unlocked}`;
  }

  return (
    <LeafletControl position={position}>
      <div className={className} onClick={handleClick} />
    </LeafletControl>
  );
};

export default DragToggleControl;
