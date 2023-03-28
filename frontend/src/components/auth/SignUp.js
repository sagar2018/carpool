import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import './SignUp.css';
import { Link } from "react-router-dom";

export default function SignUp({ setToken }) {

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setconfirmPassword] = useState("");
  const [phone_number,setPhoneNumber]=useState();

  function signupUser(userDetails) {
    return fetch("https://18.221.134.12:8090/api" + '/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userDetails)
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error(response.statusText);
      })
      .then((responseJson) => {
        localStorage.setItem('id',responseJson.user._id)
        return responseJson;
      })
      .catch((error) => {
        alert(error);
      });
  }
  const handleSubmit = async e => {
    e.preventDefault();
    const data = {
      name,
      lastname,
      email,
      password,
      confirmpassword,
      phone_number
    }
    if (email.endsWith("@uregina.ca")) {
      const sessionUserDetails = await signupUser(data);
      if (sessionUserDetails && sessionUserDetails.token) {
        setToken({ token: sessionUserDetails.token, name: sessionUserDetails.user.name });
        window.location.reload();
      }
    } else {
      alert("Please enter university email.")
    }
  }

  function validateForm() {
    return email.length > 0 && password.length > 0 &&
      name.length > 0 && lastname.length > 0 &&
      password === confirmpassword
  }

  return (
    <div className="signup-container">
      <div className="signup-content">
        <Form onSubmit={handleSubmit}>
          <h3 className="heading-text">Sign Up</h3>

          <Form.Group size="lg" controlId="name">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              autoFocus
              data-test="first-name-form-control"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group size="lg" controlId="lastname">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              autoFocus
              data-test="last-name-form-control"
              type="text"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </Form.Group>

          <Form.Group size="lg" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              autoFocus
              data-test="email-form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group size="lg" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              data-test="password-form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Form.Group size="lg" controlId="confirmpassword">
            <Form.Label>Confirm Password </Form.Label>
            <Form.Control
              autoFocus
              data-test="conf-password-form-control"
              type="password"
              value={confirmpassword}
              onChange={(e) => setconfirmPassword(e.target.value)}
            />
          </Form.Group>
          
          <Button size="lg" type="submit" disabled={!validateForm()} className="signup-button" data-test="signup-button">
            Sign Up
          </Button>
        </Form>
        <Link to='/login' className="login-link">Login</Link>
      </div>
    </div>
  );
  // Login.propTypes = {
  //     setToken: PropTypes.func.isRequired
  //   };

}
