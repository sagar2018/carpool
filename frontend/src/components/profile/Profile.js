import React, { useState } from 'react';
import {
    MDBCol,
    MDBContainer,
    MDBRow,
    MDBCard,
    MDBCardText,
    MDBCardBody,
    MDBCardImage,
    MDBInput,
} from 'mdb-react-ui-kit';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import axios from 'axios';

export default function Profile() {

    const [user,setUser] = useState({});
    var id = localStorage.getItem("id");
    console.log(id);
    axios.get('http://18.224.165.108:8080/api/user/details?userId='+id).then((res)=>{
        console.log(res)
        setUser(res.data.user);
        console.log(res.data.user.name)
    })
    return (
        <section style={{ backgroundColor: '#eee' }}>
            <MDBContainer className="py-5">
                <MDBRow>
                    <MDBCol lg="4">
                        <MDBCard className="mb-4">
                            <MDBCardBody className="text-center">
                                <MDBCardImage
                                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3.webp"
                                    alt="avatar"
                                    className="rounded-circle"
                                    style={{ width: '150px' }}
                                    fluid />
                                <p className="text-muted mb-1">Full Stack Developer</p>
                                <p className="text-muted mb-4">Bay Area, San Francisco, CA</p>
                                {/* <div className="d-flex justify-content-center mb-2">
                                    <MDBBtn>Follow</MDBBtn>
                                    <MDBBtn outline className="ms-1">Message</MDBBtn>
                                </div> */}
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                    <MDBCol lg="8">
                        <MDBCard className="mb-4">
                            <MDBCardBody>
                                <MDBRow>
                                    <MDBCol sm="3">
                                        <MDBCardText>First Name</MDBCardText>
                                    </MDBCol>
                                    <MDBCol sm="9">
                                        <MDBCardText className="text-muted">{user.name}</MDBCardText>
                                    </MDBCol>
                                </MDBRow>
                                <hr />
                                <MDBRow>
                                    <MDBCol sm="3">
                                        <MDBCardText>Last name</MDBCardText>
                                    </MDBCol>
                                    <MDBCol sm="9">
                                        <MDBCardText className="text-muted">{user.lastname}</MDBCardText>
                                    </MDBCol>
                                </MDBRow>
                                <hr />
                                <MDBRow>
                                    <MDBCol sm="3">
                                        <MDBCardText>Email</MDBCardText>
                                    </MDBCol>
                                    <MDBCol sm="9">
                                        <MDBCardText className="text-muted">{user.email}</MDBCardText>
                                    </MDBCol>
                                </MDBRow>
                                <hr />
                                <MDBRow>
                                    <MDBCol sm="3">
                                        <MDBCardText>Mobile</MDBCardText>
                                    </MDBCol>
                                    <MDBCol sm="9">
                                        <MDBCardText className="text-muted">(098) 765-4321</MDBCardText>
                                    </MDBCol>
                                </MDBRow>
                                <hr />
                                <MDBRow>
                                    <MDBCol sm="3">
                                        <MDBCardText>Address</MDBCardText>
                                    </MDBCol>
                                    <MDBCol sm="9">
                                        <MDBCardText className="text-muted">Bay Area, San Francisco, CA</MDBCardText>
                                    </MDBCol>
                                </MDBRow>
                            </MDBCardBody>
                        </MDBCard>

                        <MDBRow>
                            <MDBCol md="15">
                                <MDBCard className="mb-4 mb-md-0">
                                    <MDBCardBody>
                                        <MDBCardText className="mb-4"><span className="text-primary font-italic me-1">*</span> Vehicle Details</MDBCardText>
                                        <Container>
                                            <Row>
                                                <Col><MDBCardText className="mb-1" style={{ fontSize: '.77rem' }}>Vehicle Name</MDBCardText>
                                                    <MDBInput id='typeText' type='text' /></Col>
                                                <Col><MDBCardText className="mb-1" style={{ fontSize: '.77rem' }}>Vehicle Make</MDBCardText>
                                                    <MDBInput id='typeText' type='text' /></Col>
                                            </Row>
                                            <Row>
                                                <Col><MDBCardText className="mt-4 mb-1" style={{ fontSize: '.77rem' }}>Vehivle Model</MDBCardText>
                                                    <MDBInput id='vehiclemodel' type='text' /></Col>
                                                <Col>
                                                    <MDBCardText className="mt-4 mb-1" style={{ fontSize: '.77rem' }}>Seats</MDBCardText>
                                                    <MDBInput id='vehiclemodel' type='text' />
                                                </Col>
                                                <Col><MDBCardText className="mt-4 mb-1" style={{ fontSize: '.77rem' }}>Vehicle Year</MDBCardText>
                                                    <MDBInput id='fueltype' type='text' /></Col>
                                            </Row>
                                        </Container>
                                        
                                    </MDBCardBody>
                                </MDBCard>
                            </MDBCol>

                        </MDBRow>
                        <Container className='mb-5'></Container>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </section>
    );
}