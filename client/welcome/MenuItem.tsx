import React from 'react';
import { useMatch, useNavigate, useResolvedPath } from 'react-router-dom';
import styles from './MenuItem.module.css';

type PropsType = {
  name: string,
  to: string,
  matchFull?: boolean,
}

const MenuItem: React.FC<PropsType> = ({
  name,
  to,
  matchFull = false,
}) => {
  const navigate = useNavigate();
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: matchFull });

  const handleClick = () => {
    navigate(to);
  };

  return (
    <div className={`${styles.menuItem} ${match ? styles.selected : ''}`} onClick={handleClick}>
      {name}
    </div>
  );
};

export default MenuItem;
