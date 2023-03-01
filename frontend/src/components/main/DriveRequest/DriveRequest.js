import React, { useState, useEffect, useRef } from 'react';
import { Button, Col, Container, FloatingLabel, Form, Row } from 'react-bootstrap';
import MapSelector from '../MapSelector';
import { DirectionsRenderer, DirectionsService, GoogleMap } from '@react-google-maps/api';
import DatePicker from "react-datepicker";
import UserDetails from '../UserDetails/UserDetails';
import "react-datepicker/dist/react-datepicker.css";
import Cookies from 'js-cookie';
import Geocode from "react-geocode";

Geocode.setApiKey("AIzaSyCCZcb_AEAcCRk0uxe-GjAtUU_ewjpDXIM");

const mapContainerStyle = {
    height: "60vh",
    width: "100%",
};
const options = {
    disableDefaultUI: true,
    zoomControl: true,
};
const center = {
    lat: 43.473078230478336,
    lng: -80.54225947407059,
};



export default function RideRequest({ setToken, setActiveTrip }) {

    const [showModal, setShowModal] = useState(false);
    const [mapType, setMapType] = useState();
    const [modalTitle, setModalTitle] = useState('Title Error');
    const [mapCoords, setMapCoords] = useState({
        src: null,
        dst: null
    });
    const [routeResp, setRouteResp] = useState();
    const [rideRouteResp, setRideRouteResp] = useState({ reload: false });
    const [rideTrip, setRideTrip] = useState();
    const [dateTime, setDateTime] = useState(new Date(new Date().getTime() + (60 * 60 * 1000)));
    const [driver, setDriver] = useState([]);
    const [ride, setRide] = useState([]);
    const [finding, setFinding] = useState(true);

    const [srcName, setsrcName] = useState("")
    const [destName, setdestName] = useState("")

    const [rideRequests, setRideRequests] = useState({ loading: true });

    const mapRef = useRef();
    const onMapLoad = (map) => {
        mapRef.current = map;
    };

    const openMapModal = (mapType) => {
        setMapType(mapType);
        setModalTitle(mapType === 'src' ? 'Source point' : 'Destination point');
        setShowModal(true);
    }

    const getLocFromCoords = (coords, type) => {
        let lat = coords['lat']
        let long = coords['lng']

        Geocode.fromLatLng(lat, long).then(
            (res) => {
                const location = res.results[0].formatted_address;
                if (type === 'src') {
                    setsrcName(location)
                }
                else {
                    setdestName(location)
                }
            },
            (err) => {
                console.error(err);
                if (type === 'src') {
                    setsrcName(lat + ',' + long)
                }
                else {
                    setdestName(lat + ',' + long)
                }
            }
        );
    }

    const handleCallback = (closeButtonClicked, mapType, mapData) => {
        setShowModal(false);
        if (closeButtonClicked) return;

        setMapCoords({
            ...mapCoords,
            [mapType]: mapData
        })
        getLocFromCoords(mapData, mapType);
    }

    const directionsCallback = (response) => {
        if (response !== null) {
            console.log(`directionsCallback`, response)
            if (response.status === 'OK')
                setRouteResp(response)
            else
                alert('Problem fetching directions')
        } else alert('Problem fetching directions')
    }

    const rideDirectionsCallback = (response) => {
        console.log(`rideDirectionsCallback`, response)
        if (response !== null) {
            if (response.status === 'OK')
                setRideRouteResp({ rideData: response, reload: false })
            else
                alert('Problem fetching directions')
        } else alert('Problem fetching directions')
    }

    const handleRideClick = (ride) => e => {
        setRide(ride)
        fetch("http://localhost:8080/api" + '/user/details?userId=' + ride.rider, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + Cookies.get('tokken'),  //another working solution
                'Coookie': Cookies.get('tokken')
            },
        })
            .then((response) => {
                if (response.ok)
                    return response.json();
                else if (response.status === 401)
                    setToken(null);
                throw new Error(response.statusText);
            })
            .then((responseJson) => {
                console.log(`responseJson`, responseJson);
                setDriver([responseJson.user]);
            })
            .catch((error) => {
                console.log(error);
                alert(error);
                // window.location.reload();
            });
    }

    const getWaypoints = (trip) => {
        let waypoints = []
        if ((mapCoords.src.lat != trip.source.lat || mapCoords.src.lon != trip.source.lon) &&
            (mapCoords.src.lat != trip.destination.lat || mapCoords.src.lon != trip.destination.lon)) {
            waypoints.push({ location: mapCoords.src, stopover: true })
        }
        if ((mapCoords.dst.lat != trip.source.lat || mapCoords.dst.lon != trip.source.lon) &&
            (mapCoords.dst.lat != trip.destination.lat || mapCoords.dst.lon != trip.destination.lon)) {
            waypoints.push({ location: mapCoords.dst, stopover: true })
        }
        console.log(`waypoints`, waypoints);
        return waypoints;
    }


    useEffect(() => {
        fetch("http://localhost:8080/api/ride/requests/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Coookie': Cookies.get('tokken')
            },
            body: JSON.stringify({
                status: "pending"
            }),
        }).then((response) => {
            console.log(`response`, response)
            if (response.ok) {
                return response.json();
            }
        }).then((responseJson) => {
            setRideRequests({ rides: [...responseJson.rideRequests], loading: false });
        }).catch((error) => {
            console.log(`error`, error);
        });
    }, []);


    return <>
        {
            rideRequests == null || rideRequests.loading ?
                <div>Loading...</div>
                :
                rideRequests != null && rideRequests.rides.length > 0
                    ? <>
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            zoom={15}
                            center={center}
                            options={options}
                            onLoad={onMapLoad}>
                            {
                                (rideRouteResp == null || rideRouteResp.reload) && (
                                    <DirectionsService
                                        // required
                                        options={{
                                            destination: rideTrip.destination,
                                            origin: rideTrip.source,
                                            travelMode: 'DRIVING',
                                            waypoints: rideTrip.waypoints,
                                            optimizeWaypoints: true,
                                        }}
                                        callback={rideDirectionsCallback}
                                    />
                                )
                            }
                            {
                                (rideRouteResp !== null && !rideRouteResp.reload) && (
                                    <DirectionsRenderer
                                        // required
                                        options={{
                                            directions: rideRouteResp.rideData
                                        }}
                                    />
                                )
                            }
                        </GoogleMap>
                        <Container fluid="lg">
                            <Row style={{ marginTop: '3rem' }}>
                                <Col>
                                    <div>Rides available</div>
                                    {rideRequests.rides.map(ride =>
                                        <Row className='p-2' key={ride._id}>
                                            <Button variant='outline-primary' onClick={handleRideClick(ride)}>Driver id {ride.driver}</Button>
                                        </Row>
                                    )}
                                </Col>
                                <Col md>
                                    {driver.map(r => {
                                        return <Container fluid="lg">
                                            <Row style={{ marginTop: '3rem' }}>
                                                <div>Driver Name: {r.name}</div>
                                            </Row>
                                        </Container>
                                    })}
                                </Col>
                            </Row>
                        </Container>
                    </>
                    : <div>No pending requests.</div>
        }
    </>
}