import React, { ReactElement } from 'react';
import {
  Navbar, Nav, NavDropdown,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Http from '@mortvola/http';
import { useProfileDialog } from './ProfileDialog';
import { useAccountDialog } from './AccountDialog';
import { useChangePasswordDialog } from './ChangePasswordDialog';

const MENU_EVENT_KEY_PROFILE = 'MENU_EVENT_KEY_PROFILE';
const MENU_EVENT_KEY_ACCOUNT = 'MENU_EVENT_KEY_ACCOUNT';
const MENU_EVENT_KEY_LOGOUT = 'MENU_EVENT_KEY_LOGOUT';
const MENU_EVENT_KEY_CHANGE_PASSWORD = 'MENU_EVENT_KEY_CHANGE_PASSWORD';

type PropsType = {
  username: string,
}

const Menubar = ({
  username,
}: PropsType): ReactElement => {
  const [ProfileDialog, showProfileDialog] = useProfileDialog();
  const [AccountDialog, showAccountDialog] = useAccountDialog();
  const [ChangePasswordDialog, showChangePasswordDialog] = useChangePasswordDialog();

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
        <Navbar.Brand href="/">SaunterQuest</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse style={{ justifyContent: 'space-between' }}>
          <Nav>
            <Nav.Link as={Link} to="/">Hikes</Nav.Link>
            <Nav.Link as={Link} to="/food">Food</Nav.Link>
            <Nav.Link as={Link} to="/gear">Gear</Nav.Link>
          </Nav>
          <Nav>
            <NavDropdown id="dropdown" className="dropdown menubar-item" title={username}>
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
