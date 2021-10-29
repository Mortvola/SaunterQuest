import React, { ReactElement } from 'react';
import {
  Navbar, Container, Nav, NavDropdown,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Http from '@mortvola/http';
import {
  MENU_EVENT_KEY_ACCOUNT, MENU_EVENT_KEY_PROFILE,
  MENU_EVENT_KEY_LOGOUT, MENU_EVENT_KEY_CHANGE_PASSWORD,
} from './menuEvents';
import { useProfileDialog } from './ProfileDialog';
import { useAccountDialog } from './AccountDialog';
import { useChangePasswordDialog } from './ChangePasswordDialog';
import { useStores } from './state/store';

type PropsType = {
  username: string,
}

const Menubar = ({
  username,
}: PropsType): ReactElement => {
  const { uiState } = useStores();
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
        if (eventKey !== null) {
          uiState.setView(eventKey);
        }
    }
  };

  return (
    <>
      <Navbar collapseOnSelect onSelect={handleSelect} expand="md">
        <Container>
          <Navbar.Brand href="/">SaunterQuest</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse style={{ justifyContent: 'space-between' }}>
            <Nav className="mr-auto">
              <Nav.Link as={Link} to="/">Hikes</Nav.Link>
              <Nav.Link as={Link} to="/food">Food</Nav.Link>
              <Nav.Link as={Link} to="/gear">Gear</Nav.Link>
            </Nav>
            <Nav className="ml-auto">
              <NavDropdown id="dropdown" className="dropdown menubar-item" title={username}>
                <Nav.Link eventKey={MENU_EVENT_KEY_ACCOUNT}>Account</Nav.Link>
                <Nav.Link eventKey={MENU_EVENT_KEY_CHANGE_PASSWORD}>Change Password</Nav.Link>
                <Nav.Link eventKey={MENU_EVENT_KEY_PROFILE}>Profile</Nav.Link>
                <Nav.Link eventKey={MENU_EVENT_KEY_LOGOUT}>Logout</Nav.Link>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <AccountDialog />
      <ChangePasswordDialog />
      <ProfileDialog />
    </>
  );
};

export default Menubar;
