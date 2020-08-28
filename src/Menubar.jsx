import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
    Navbar,
    Container,
    Nav,
    NavDropdown,
} from 'react-bootstrap';
import { navigate } from './redux/actions';
import {
    VIEW_HIKES,
    VIEW_GEAR,
    VIEW_FOOD,
    MENU_EVENT_KEY_ACCOUNT,
    MENU_EVENT_KEY_PROFILE,
    MENU_EVENT_KEY_LOGOUT,
} from './menuEvents';
import { useProfileDialog } from './ProfileDialog';

const Menubar = ({ dispatch }) => {
    const [ProfileDialog, showProfileDialog] = useProfileDialog();

    const handleSelect = (eventKey) => {
        if (eventKey === MENU_EVENT_KEY_PROFILE) {
            showProfileDialog();
        }
        else {
            dispatch(navigate(eventKey));
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
                        <NavDropdown className="dropdown menubar-item" title={sessionStorage.getItem('username')}>
                            <Nav.Link eventKey={MENU_EVENT_KEY_ACCOUNT}>Account</Nav.Link>
                            <Nav.Link eventKey={MENU_EVENT_KEY_PROFILE}>Profile</Nav.Link>
                            <Nav.Link eventKey={MENU_EVENT_KEY_LOGOUT}>Logout</Nav.Link>
                        </NavDropdown>
                    </Nav>
                </div>
            </Container>
            <ProfileDialog />
        </Navbar>
    );
};

Menubar.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Menubar);
