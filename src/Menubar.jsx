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
import { VIEW_HIKES, VIEW_GEAR, VIEW_FOOD } from './views';

const Menubar = ({ dispatch }) => {
    const handleSelect = (eventKey) => {
        dispatch(navigate(eventKey));
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
                            <Nav.Link eventKey="account">Account</Nav.Link>
                            <Nav.Link eventKey="account">Profile</Nav.Link>
                            <Nav.Link eventKey="logout">Logout</Nav.Link>
                        </NavDropdown>
                    </Nav>
                </div>
            </Container>
        </Navbar>
    );
};

Menubar.propTypes = {
    dispatch: PropTypes.func.isRequired,
};

export default connect()(Menubar);
