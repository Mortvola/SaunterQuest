import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Login from '../login/Login';
import Register from '../login/Register';
import styles from './Main.module.css';
import Ukraine from './Ukraine';
import Menu from './Menu';
import ScrollWrapper from '../ScrollWrapper';

const Main: React.FC = observer(() => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [smallTitle, setSmallTitle] = useState<boolean>(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLoginHide = () => {
    setShowLogin(false);
  };

  // const handleRegisterClick = () => {
  //   setShowRegister(true);
  // };

  const handleRegisterHide = () => {
    setShowRegister(false);
  };

  const handleScroll = (scrollTop: number) => {
    setSmallTitle(scrollTop > 100);
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div
          className={`${styles.title} ${smallTitle ? styles.small : ''}`}
        >
          SaunterQuest
        </div>
        <div className={styles.links}>
          <div className={styles.welcomeButton} onClick={handleLoginClick}>Login</div>
          {
            // <div className={styles.welcomeButton} onClick={handleRegisterClick}>Register</div>
          }
        </div>
        <Menu />
      </div>
      <ScrollWrapper onScroll={handleScroll}>
        <Outlet />
      </ScrollWrapper>
      <Login show={showLogin} onHide={handleLoginHide} />
      <Register show={showRegister} onHide={handleRegisterHide} />
    </div>
  );
});

export default Main;
