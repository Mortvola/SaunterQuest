import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { matchPath, useHistory } from 'react-router-dom';
import Login from '../login/Login';
import Register from '../login/Register';
import { useStores } from './state/store';
import Blog from '../Blog/Blog';
import styles from './Main.module.css';
import BlogList from './BlogList';
import { BlogListItemInterface } from '../Blog/state/Types';
import Ukraine from './Ukraine';
import Menu from './Menu';
import { ItemId } from './MenuItem';

type PropsType = {
  tileServerUrl: string,
}

const Main: React.FC<PropsType> = observer(({ tileServerUrl }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { blogManager } = useStores();
  const [smallTitle, setSmallTitle] = useState<boolean>(false);
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

  const handleSelection = (blog: BlogListItemInterface) => {
    window.location.replace(`/blog/${blog.id}`);
  };

  const handleScroll = (scrollTop: number) => {
    setSmallTitle(scrollTop > 100);
  };

  const [active, setActive] = React.useState<ItemId>('home');

  const handleSelect = (itemId: ItemId) => {
    setActive(itemId);
  };

  const displayContent = () => {
    switch (active) {
      case 'home': {
        return blogManager.current
          ? (
            <Blog
              blog={blogManager.current}
              tileServerUrl={tileServerUrl}
              onScroll={handleScroll}
              smallTitle={smallTitle}
            />
          )
          : null;
      }

      case 'archives':
        return <BlogList onSelection={handleSelection} />;

      default:
        return null;
    }
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
        <Menu active={active} onSelect={handleSelect} />
      </div>
      {
        displayContent()
      }
      <Login show={showLogin} onHide={handleLoginHide} />
      <Register show={showRegister} onHide={handleRegisterHide} />
    </div>
  );
});

export default Main;
