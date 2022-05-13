import React from 'react';
import styles from './MenuItem.module.css';

export type ItemId = 'home' | 'photos' | 'archives';

type PropsType = {
  name: string,
  itemId: ItemId,
  onSelect: (id: ItemId) => void,
  selected: boolean,
}

const MenuItem: React.FC<PropsType> = ({
  name,
  itemId,
  onSelect,
  selected,
}) => {
  const handleClick = () => {
    onSelect(itemId);
  };

  return (
    <div className={`${styles.menuItem} ${selected ? styles.selected : ''}`} onClick={handleClick}>
      {name}
    </div>
  );
};

export default MenuItem;
