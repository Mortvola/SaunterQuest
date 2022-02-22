import React, { ReactElement } from 'react';
import {
  Navbar, Nav, NavDropdown,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Http from '@mortvola/http';
import { useProfileDialog } from './ProfileDialog';
import { useAccountDialog } from './AccountDialog';
import { useChangePasswordDialog } from './ChangePasswordDialog';
import useMediaQuery from './MediaQuery';
import styles from './Menubar.module.css';

const MENU_EVENT_KEY_PROFILE = 'MENU_EVENT_KEY_PROFILE';
const MENU_EVENT_KEY_ACCOUNT = 'MENU_EVENT_KEY_ACCOUNT';
const MENU_EVENT_KEY_LOGOUT = 'MENU_EVENT_KEY_LOGOUT';
const MENU_EVENT_KEY_CHANGE_PASSWORD = 'MENU_EVENT_KEY_CHANGE_PASSWORD';

type PropsType = {
  username: string,
  onShowOffcanvas: () => void,
}

const Menubar = ({
  username,
  onShowOffcanvas,
}: PropsType): ReactElement => {
  const [ProfileDialog, showProfileDialog] = useProfileDialog();
  const [AccountDialog, showAccountDialog] = useAccountDialog();
  const [ChangePasswordDialog, showChangePasswordDialog] = useChangePasswordDialog();
  const { isMobile } = useMediaQuery();

  const logout = async () => {
    const response = await Http.post('/logout');

    if (response.ok) {
      window.location.replace('/');
    }
  };

  const handleSelect = (eventKey: string | null) => {
    switch (eventKey) {
      case MENU_EVENT_KEY_ACCOUNT:
        showAccountDialog();
        break;

      case MENU_EVENT_KEY_CHANGE_PASSWORD:
        showChangePasswordDialog();
        break;

      case MENU_EVENT_KEY_PROFILE:
        showProfileDialog();
        break;

      case MENU_EVENT_KEY_LOGOUT:
        logout();
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Navbar collapseOnSelect onSelect={handleSelect} expand="md">
        {
          isMobile
            ? (
              <Navbar.Text>
                <div className={styles.offcanvasToggle} onClick={onShowOffcanvas}>{'>'}</div>
              </Navbar.Text>
            )
            : null
        }
        <Navbar.Brand href="/">
          SaunterQuest
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse style={{ justifyContent: 'space-between' }}>
          <Nav>
            <Nav.Link as={Link} to="/">Hikes</Nav.Link>
            <Nav.Link as={Link} to="/food">Food</Nav.Link>
            <Nav.Link as={Link} to="/gear">Gear</Nav.Link>
            <Nav.Link as={Link} to="/blog">Blog</Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown id="dropdown" className={styles.menubarZIndex} title={username} align="end">
              <Nav.Link eventKey={MENU_EVENT_KEY_ACCOUNT}>Account</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_CHANGE_PASSWORD}>Change Password</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_PROFILE}>Profile</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_LOGOUT}>Logout</Nav.Link>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <AccountDialog />
      <ChangePasswordDialog />
      <ProfileDialog />
    </>
  );
};

export default Menubar;
