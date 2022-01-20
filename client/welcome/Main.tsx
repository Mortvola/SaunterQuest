import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import Login from '../login/Login';
import Register from '../login/Register';
import BlogItem from './BlogItem';
import { useStores } from './state/store';
import Banner from './Banner/Banner';
import styles from './Main.module.css';

const Main: React.FC = observer(() => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { blogManager } = useStores();
  const [slideOutOpen, setSlideOutOpen] = useState(false);

  useEffect(() => {
    (async () => {
      blogManager.load();
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
        <Banner />
        <button type="button" onClick={handleSlideOutOpen}>test</button>
        <div className={styles.intro}>
          I have often felt that the pictures I have taken along the trail
          loose a lot of context. Especially in the mountains.
        </div>
        <div>
          {
            blogManager.blogs.map((b) => (
              <BlogItem key={b.id} blog={b} />
            ))
          }
        </div>
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
