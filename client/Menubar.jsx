import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Navbar,
  Container,
  Nav,
  NavDropdown,
} from 'react-bootstrap';
import { setView } from './redux/actions';
import {
  VIEW_HIKES,
  VIEW_GEAR,
  VIEW_FOOD,
  MENU_EVENT_KEY_ACCOUNT,
  MENU_EVENT_KEY_PROFILE,
  MENU_EVENT_KEY_LOGOUT,
} from './menuEvents';
import { useProfileDialog } from './ProfileDialog';
import { useAccountDialog } from './AccountDialog';

const Menubar = ({
  username,
  dispatch,
}) => {
  const [ProfileDialog, showProfileDialog] = useProfileDialog();
  const [AccountDialog, showAccountDialog] = useAccountDialog();

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
    case MENU_EVENT_KEY_PROFILE:
      showProfileDialog();
      break;

    case MENU_EVENT_KEY_LOGOUT:
      logout();
      break;

    default:
      dispatch(setView(eventKey));
    }
  };

  return (
    <Navbar onSelect={handleSelect}>
      <Container>
        <Navbar.Brand href="/">SaunterQuest</Navbar.Brand>

        <div className="collapse navbar-collapse">
          <Nav className="mr-auto">
            <Nav.Link eventKey={VIEW_HIKES}>Hikes</Nav.Link>
            <Nav.Link eventKey={VIEW_FOOD}>Food</Nav.Link>
            <Nav.Link eventKey={VIEW_GEAR}>Gear</Nav.Link>
          </Nav>
          <Nav className="ml-auto">
            <NavDropdown className="dropdown menubar-item" title={username}>
              <Nav.Link eventKey={MENU_EVENT_KEY_ACCOUNT}>Account</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_PROFILE}>Profile</Nav.Link>
              <Nav.Link eventKey={MENU_EVENT_KEY_LOGOUT}>Logout</Nav.Link>
            </NavDropdown>
          </Nav>
        </div>
      </Container>
      <AccountDialog />
      <ProfileDialog />
    </Navbar>
  );
};

Menubar.propTypes = {
  username: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect()(Menubar);
