import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { matchPath, useHistory } from 'react-router-dom';
import Login from '../login/Login';
import Register from '../login/Register';
import { useStores } from './state/store';
import Blog from '../Blog/Blog';
import styles from './Main.module.css';
import IconButton from '../IconButton';
import BlogList from './BlogList';
import { BlogListItemInterface } from '../Blog/state/Types';
import Ukraine from './Ukraine';

type PropsType = {
  tileServerUrl: string,
}

const Main: React.FC<PropsType> = observer(({ tileServerUrl }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { blogManager } = useStores();
  const [slideOutOpen, setSlideOutOpen] = useState(false);
  const history = useHistory();

  useEffect(() => {
    (async () => {
      if (blogManager.current === null) {
        const match = matchPath<{ id: string }>(history.location.pathname, { path: '/blog/:id', exact: true });
        if (match) {
          blogManager.getBlog(parseInt(match.params.id, 10));
        }
        else {
          blogManager.getBlog('latest');
        }
      }
    })();
  }, [blogManager, history.location.pathname]);

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

  const handleSlideOutOpen = () => {
    setSlideOutOpen(true);
  };

  const handleSlideOutClose = () => {
    setSlideOutOpen(false);
  };

  const handleSelection = (blog: BlogListItemInterface) => {
    setSlideOutOpen(false);
    window.location.replace(`/blog/${blog.id}`);
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.main}>
          <div className={styles.title}>SaunterQuest</div>
          <div className={styles.links}>
            <div className={styles.welcomeButton} onClick={handleLoginClick}>Login</div>
            {
              // <div className={styles.welcomeButton} onClick={handleRegisterClick}>Register</div>
            }
          </div>
        </div>
        <Ukraine />
        <IconButton icon="angle-right" className={styles.offCanvasButton} onClick={handleSlideOutOpen} />
        {
          blogManager.current
            ? <Blog blog={blogManager.current} tileServerUrl={tileServerUrl} />
            : null
        }
        <Login show={showLogin} onHide={handleLoginHide} />
        <Register show={showRegister} onHide={handleRegisterHide} />
      </div>
      <Offcanvas show={slideOutOpen} onHide={handleSlideOutClose}>
        <Offcanvas.Header closeButton />
        <Offcanvas.Body>
          {
            slideOutOpen
              ? <BlogList onSelection={handleSelection} />
              : null
          }
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
});

export default Main;
