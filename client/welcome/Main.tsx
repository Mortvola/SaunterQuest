import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import Login from '../login/Login';
import Register from '../login/Register';
import BlogItem from './BlogItem';
import { useStores } from './state/store';

const Main: React.FC = observer(() => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { blogManager } = useStores();

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

  const className = 'position-ref full-height';
  // className += ' light';

  return (
    <>
      <div className={className}>
        <div>
          <h5>SaunterQuest</h5>
          <div className="top-right links">
            <div className="welcome-button" onClick={handleLoginClick}>Login</div>
            <div className="welcome-button" onClick={handleRegisterClick}>Register</div>
          </div>
        </div>
        <div>
          {
            blogManager.blogs.map((b) => (
              <BlogItem key={b.id} blog={b} />
            ))
          }
        </div>
      </div>
      <Login show={showLogin} onHide={handleLoginHide} />
      <Register show={showRegister} onHide={handleRegisterHide} />
    </>
  );
});

export default Main;
