import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import './Login.css';
import { Link } from "react-router-dom";

export default function Login({ setToken, setActiveTrip }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function loginUser(credentials) {
       // console.log(credentials);
        return fetch("http://18.224.165.108:8080/api" + '/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        })
            .then((response) => {
                //console.log(response.user);
                if (response.ok) {
                    return response.json();
                }
                throw new Error(response.statusText);
            })
            .then((responseJson) => {
                return responseJson;
            })
            .catch((error) => {
                alert(error);
            });
    }

    const handleSubmit = async e => {
        e.preventDefault();
        const data = {
            email,
            password
        }
        const sessionUserDetails = await loginUser(data);
        localStorage.setItem('id',sessionUserDetails.user._id);
        if (sessionUserDetails) {
            if (sessionUserDetails.user.active_trip)
                setActiveTrip(sessionUserDetails.user.active_trip);
            if (sessionUserDetails.token)
                setToken({ token: sessionUserDetails.token, name: sessionUserDetails.user.name });
            //window.location.reload();
        }
    }

    function validateForm() {
        return email.length > 0 && password.length > 0;
    }

    return (
        <div className="login-container">
            <div className="login-content">
                <Form onSubmit={handleSubmit} data-test="login-form">
                    <h3 className="heading-text">Login</h3>
                    <Form.Group size="lg" controlId="email" className="form-group">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            data-test="email-form-control"
                            autoFocus
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group size="lg" controlId="password" className="form-group">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            data-test="password-form-control"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Form.Group>
                    <Button data-test="login-button" size="lg" type="submit" disabled={!validateForm()} className="login-button">
                        Login
                    </Button>
                </Form>
                <Link to='/signup' className="signup-link">SignUp</Link>
            </div>
        </div>
    );
}

// Login.propTypes = {
//     setToken: PropTypes.func.isRequired
//   };
