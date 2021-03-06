import React from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, Container, Nav, NavDropdown,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  MENU_EVENT_KEY_ACCOUNT, MENU_EVENT_KEY_PROFILE,
  MENU_EVENT_KEY_LOGOUT, MENU_EVENT_KEY_CHANGE_PASSWORD,
} from './menuEvents';
import { useProfileDialog } from './ProfileDialog';
import { useAccountDialog } from './AccountDialog';
import { useChangePasswordDialog } from './ChangePasswordDialog';
import { useStores } from './state/store';

const Menubar = ({
  username,
}) => {
  const { uiState } = useStores();
  const [ProfileDialog, showProfileDialog] = useProfileDialog();
  const [AccountDialog, showAccountDialog] = useAccountDialog();
  const [ChangePasswordDialog, showChangePasswordDialog] = useChangePasswordDialog();

  const logout = () => {
    fetch('/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    })
      .then((response) => {
        if (response.ok) {
          window.location.replace('/');
        }
      });
  };

  const handleSelect = (eventKey) => {
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
        uiState.setView(eventKey);
    }
  };

  return (
    <Navbar onSelect={handleSelect}>
      <Container>
        <Navbar.Brand href="/">SaunterQuest</Navbar.Brand>

        <div className="collapse navbar-collapse">
          <Nav className="mr-auto">
            <Nav.Link as={Link} to="/">Hikes</Nav.Link>
            <Nav.Link as={Link} to="/food">Food</Nav.Link>
            <Nav.Link as={Link} to="/gear">Gear</Nav.Link>
          </Nav>
          <Nav className="ml-auto">
            <NavDropdown className="dropdown menubar-item" title={username}>
              <Nav.Link eventKey={MENU_EVENT_KEY_ACCOUNT}>Account</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_CHANGE_PASSWORD}>Change Password</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_PROFILE}>Profile</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_LOGOUT}>Logout</Nav.Link>
            </NavDropdown>
          </Nav>
        </div>
      </Container>
      <AccountDialog />
      <ChangePasswordDialog />
      <ProfileDialog />
    </Navbar>
  );
};

Menubar.propTypes = {
  username: PropTypes.string.isRequired,
};

export default Menubar;
