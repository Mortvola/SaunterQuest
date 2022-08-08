import React from 'react';
import styles from './Menu.module.css';
import MenuItem from './MenuItem';

const Menu: React.FC = () => (
  <div className={styles.menu}>
    <MenuItem name="Home" to="/" matchFull />
    <MenuItem name="Photos" to="/photos" />
    <MenuItem name="Archives" to="/blog" />
  </div>
);

export default Menu;
