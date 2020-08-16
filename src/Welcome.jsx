import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import 'regenerator-runtime/runtime';
import Login from './login/Login';
import Register from './login/Register';

const Welcome = ({
    authed,
}) => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleHomeClick = () => {
        window.location.replace('/home');
    };

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

    const handleLoad = () => {
        document.querySelector('body').className = 'background';
        setImageLoaded(true);
    };

    let className = 'flex-center position-ref full-height';
    if (imageLoaded) {
        className += ' light';
    }
    else {
        className += ' dark';
    }

    return (
        <div className={className}>
            <div className="top-right links" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
                {
                    authed ? (
                        <div className="welcome-button" onClick={handleHomeClick}>Home</div>
                    )
                        : (
                            <>
                                <div className="welcome-button" onClick={handleLoginClick}>Login</div>
                                <div className="welcome-button" onClick={handleRegisterClick}>Register</div>
                            </>
                        )
                }
            </div>
            <div className="content">
                <div className="titles">
                    <div className="title">
                        SaunterQuest
                    </div>
                    <div className="subtitle">
                        It&apos;s about
                        {' '}
                        <u><em>time</em></u>
                    </div>
                </div>
                <div className="quote">
                    <div>
                        &quot;I don&apos;t like either the word [hike] or the thing.
                    </div>
                    <div>People ought to saunter in the mountains...&quot;</div>
                    <div className="attribution">-- John Muir</div>
                </div>
            </div>
            <Login show={showLogin} onHide={handleLoginHide} />
            <Register show={showRegister} onHide={handleRegisterHide} />
            <img src="/Forester.jpg" alt="" onLoad={handleLoad} style={{ display: 'none' }} />
        </div>
    );
};

Welcome.propTypes = {
    authed: PropTypes.bool.isRequired,
};

const data = document.querySelector('.app').getAttribute('data');
ReactDOM.render(
    <Welcome authed={data !== '0'} />,
    document.querySelector('.app'),
);