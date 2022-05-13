import React from 'react';
import styles from './Menu.module.css';
import MenuItem, { ItemId } from './MenuItem';

type PropsType = {
  active: ItemId,
  onSelect: (itemId: ItemId) => void,
}

const Menu: React.FC<PropsType> = ({ active, onSelect }) => (
  <div className={styles.menu}>
    <MenuItem name="Home" itemId="home" onSelect={onSelect} selected={active === 'home'} />
    <MenuItem name="Photos" itemId="photos" onSelect={onSelect} selected={active === 'photos'} />
    <MenuItem name="Archives" itemId="archives" onSelect={onSelect} selected={active === 'archives'} />
  </div>
);

export default Menu;
