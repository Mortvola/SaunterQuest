import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import Login from '../login/Login';
import Register from '../login/Register';
import { useStores } from './state/store';
import Blog from '../Blog/Formatted/Blog';
import styles from './Main.module.css';

const Main: React.FC = observer(() => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { blogManager } = useStores();
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  useEffect(() => {
    (async () => {
      blogManager.load();
      blogManager.getBlog('latest');
    })();
  }, [blogManager]);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLoginHide = () => {
    setShowLogin(false);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
  };

  const handleRegisterHide = () => {
    setShowRegister(false);
  };

  const handleSlideOutOpen = () => {
    setSlideOutOpen(true);
  };

  const handleSlideOutClose = () => {
    setSlideOutOpen(false);
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.main}>
          <div className={styles.title}>SaunterQuest</div>
          <div className={styles.links}>
            <div className={styles.welcomeButton} onClick={handleLoginClick}>Login</div>
            <div className={styles.welcomeButton} onClick={handleRegisterClick}>Register</div>
          </div>
        </div>
        {
          blogManager.latestBlog
            ? <Blog blog={blogManager.latestBlog} />
            : null
        }
        <Login show={showLogin} onHide={handleLoginHide} />
        <Register show={showRegister} onHide={handleRegisterHide} />
      </div>
      <Offcanvas show={slideOutOpen} onHide={handleSlideOutClose}>
        <Offcanvas.Header closeButton>
          This is a test.
        </Offcanvas.Header>
        <Offcanvas.Body>
          This is the body.
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
});

export default Main;
