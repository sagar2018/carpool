const Trip = require("../Models/tripModel");
const TripRequest = require("../Models/tripRequest");
const User = require("../Models/user");
const dotenv = require("dotenv");
const { Client } = require("@googlemaps/google-maps-services-js");
var polylineUtil = require('@mapbox/polyline');
const mapsClient = new Client({});
const { PolyUtil } = require("node-geometry-library");
const tripRequest = require("../Models/tripRequest");
const mongoose = require("mongoose");
const { db } = require("../Models/user");
dotenv.config()

// const MS_PER_MINUTE = 60000;
const offsetDurationInMinutes = 15;
const pct = .3; // Percent of route points for source (others are checked for destination)
const radiusOffset = 50;    //TODO: TUNE

exports.activeTrip = (req, res) => {
    var riderArray = [];
    User.findById(req.auth._id, (err, user) => {

        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        }
        Trip.findById(user.active_trip, (err, trip) => {

            User.findById(trip.driver, (err, user_driver) => {
                const riders = trip.riders;

                if (riders.length === 0) {
                    res.status(200).json({
                        ...trip._doc,
                        riders: riderArray,
                        driver: user_driver.name + ' ' + user_driver.lastname
                    })
                }

                var i = 0;
                riders.forEach(rider => {
                    User.findById(rider, (err, user_rider) => {

                        if (err)
                            return res.status(500).end();
                        riderArray.push(String(user_rider.name + ' ' + user_rider.lastname));
                        i++;
                        if (i == riders.length) {
                            return res.status(200).json({
                                ...trip._doc,
                                riders: riderArray,
                                driver: user_driver.name + ' ' + user_driver.lastname
                            })
                        }
                    })
                })
            });
        });
    });
}

exports.drive = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (err) {
            console.log(`user error`, err)
            return res.status(500).end();
        }

        const tripObj = new Trip({
            driver: req.auth._id,
            source: req.body.src,
            destination: req.body.dst,
            route: req.body.route,
            dateTime: new Date(req.body.dateTime),
            max_riders: req.body.max_riders,
            baseDuration: req.body.baseDuration,
            baseDistance: req.body.baseDistance,
        });
        tripObj.save((err, trip) => {
            if (err) {
                console.log(`error`, err)
                return res.status(500).end();
            }
            res.status(200).json(trip);
            user.active_trip = trip._id;
            user.trip_role_driver = true;
            user.save((err) => {
                if (err) {
                    trip.deleteOne();
                    return res.status(500).end();
                }
                return res;
            })
            return res.status(500).end();
        })
    })
}

exports.ride = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            //Matching logic START
            let startDateTime = new Date(req.body.dateTime);
            startDateTime.setMinutes(startDateTime.getMinutes() - offsetDurationInMinutes);
            let endDateTime = new Date(req.body.dateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + offsetDurationInMinutes);
            Trip.find({
                completed: false,   //trip is active
                available_riders: true,
                date: {
                    $gte: startDateTime,
                    $lte: endDateTime
                },
            }, function (err, trips) {
                if (err) {
                    res.statusMessage = "No matches found. No trips around your time.";
                    return res.status(400).end();
                }
                var trip;
                trips.forEach(tempTrip => {
                    const pctLen = parseInt(tempTrip.route.length * pct)
                    let found = PolyUtil.isLocationOnPath(
                        req.body.src,
                        tempTrip.route.slice(0, pctLen),
                        radiusOffset
                    );
                    if (found) {
                        found = PolyUtil.isLocationOnPath(
                            req.body.dst,
                            tempTrip.route.slice(pctLen),
                            radiusOffset
                        );
                        if (found) {
                            trip = tempTrip;
                            return;
                        }
                    }
                });
                //Matching logic END
                if (trip == undefined || trip == null) {
                    res.statusMessage = "No match found";
                    return res.status(400).end();
                }
                trip.waypoints = [...trip.waypoints, req.body.src, req.body.dst];
                mapsClient.directions({
                    params: {
                        origin: trip.source,
                        destination: trip.destination,
                        waypoints: trip.waypoints,
                        drivingOptions: {
                            departureTime: new Date(trip.dateTime),  // for the time N milliseconds from now.
                        },
                        optimize: true,
                        key: "AIzaSyCCZcb_AEAcCRk0uxe-GjAtUU_ewjpDXIM"
                    },
                    timeout: 2000, // milliseconds
                })
                    .then((r) => {
                        const routeArray = polylineUtil.decode(r.data.routes[0].overview_polyline.points);
                        trip.route = Object.values(routeArray)
                            .map(item => ({ lat: item[0], lng: item[1] }));
                        trip.riders.push(user._id);
                        trip.available_riders = !(trip.riders.length === trip.max_riders);
                        trip.save((err, trip) => {
                            // if (err)
                            //     return res.status(500).end();
                            res.status(200).json(trip);
                            user.active_trip = trip._id;
                            user.trip_role_driver = false;
                            user.save((err) => {
                                // if (err) {
                                //     //TODO: revert
                                //     return res.status(500).end();
                                // }
                                return res;
                            })
                            return res.status(500).end();
                        });
                    })
                // .catch((e) => {
                //     res.statusMessage = e.response.data.error_message;
                //     return res.status(400).end();
                // });
            });
        } else {
            res.statusMessage = "A trip is already active";
            return res.status(400).end();
        }
    })
}

exports.cancelTrip = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                // if (err)
                //     return res.status(500).end();
                if (trip) {
                    if (user.trip_role_driver) {
                        trip.riders.forEach(rider => {  //3
                            User.findById(rider, (err, user_rider) => {
                                if (err)
                                    return res.status(500).end();
                                else {
                                    user_rider.active_trip = null;
                                    user_rider.trip_role_driver = null;
                                    user_rider.save((err) => {
                                        // if (err) {
                                        //     //TODO: revert
                                        //     res.statusMessage = "Error in saving user data for a rider.";
                                        //     return res.status(500).end();
                                        // }
                                    })
                                }
                            })
                        });
                        trip.deleteOne((err) => {
                            // if (err) {
                            //     res.statusMessage = "Error in deleting trip object";
                            //     return res.status(500).end();
                            // }
                        });
                    } else {
                        const riderIndex = trip.riders.indexOf(user._id);
                        trip.waypoints.splice(riderIndex * 2, 2);
                        mapsClient.directions({
                            params: {
                                origin: trip.source,
                                destination: trip.destination,
                                waypoints: trip.waypoints,
                                drivingOptions: {
                                    departureTime: new Date(trip.dateTime),  // for the time N milliseconds from now.
                                },
                                optimize: true,
                                key: "AIzaSyCCZcb_AEAcCRk0uxe-GjAtUU_ewjpDXIM"
                            },
                            timeout: 2000, // milliseconds
                        })
                            .then((r) => {
                                const routeArray = polylineUtil.decode(r.data.routes[0].overview_polyline.points);
                                trip.route = Object.values(routeArray)
                                    .map(item => ({ lat: item[0], lng: item[1] }));
                                trip.riders.splice(riderIndex);
                                trip.available_riders = true;
                                trip.save((err) => {
                                    if (err)
                                        return res.status(500).end();
                                });
                            })
                            .catch((e) => {
                                res.statusMessage = e.response.data.error_message;
                                return res.status(400).end();
                            });
                    }
                }
                user.active_trip = null;
                user.trip_role_driver = null;
                user.save((err) => {
                    // if (err) {
                    //     res.statusMessage = "Error in saving user. Trip was deleted/modified.";
                    //     return res.status(500).end();
                    // }
                    res.status(200).end();
                    return res;
                });
            });
        }
    })
}

exports.tripHistory = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        // else {
        Trip.find({ '_id': { $in: user.trips } }, (err, trips) => {
            // if (err)
            //     return res.status(500).end();
            res.status(200).json(trips);
            return res;
        })
        // }
    })
}

exports.tripDone = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        // else {

        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                // if (err)
                //     return res.status(500).end();
                // else {
                trip.completed = true;
                trip.save((err) => {    //1
                    // if (err) {
                    //     res.statusMessage = "Error in saving trip status.";
                    //     return res.status(500).end();
                    // }
                });
                user.trips.push(trip._id);
                user.active_trip = null;
                user.trip_role_driver = null;
                user.save((err) => {    //2
                    // if (err) {
                    //     res.statusMessage = "Error in saving trip to table.";
                    //     return res.status(500).end();
                    // }
                });
                trip.riders.forEach(rider => {  //3
                    User.findById(rider, (err, user_rider) => {
                        // if (err)
                        //     return res.status(500).end();
                        // else {
                        user_rider.trips.push(trip._id);
                        user_rider.active_trip = null;
                        user_rider.trip_role_driver = null;
                        user_rider.save((err) => {
                            // if (err) {
                            //     //TODO: revert
                            //     res.statusMessage = "Error in saving user data for a rider.";
                            //     return res.status(500).end();
                            // }
                        })
                        // }
                    })
                });
                //POTENTIAL ISSUE (should not be since foreach is NOT async): Need to return 200 when 1, 2, 3 (all) are done
                return res.status(200).end();
                // }
            })
        }
        // }
    })
}


exports.isDriver = (req, res) => {
    User.findById(req.auth._id, (err, user) => {

        if (user.trip_role_driver == undefined || user.trip_role_driver == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        }
        else
            res.status(200).json({ "isdriver": user.trip_role_driver })

    })
}

exports.trips = async (req, res) => {
    var riderArray = [];

    Trip.aggregate([
        { "$match": { "completed": req.body.completed } },
        {
            "$lookup": {
                from: 'users',
                localField: 'driver',
                foreignField: '_id',
                as: 'driverDetails'
            }
        },
    ], (err, trips) => {
        var tripsResponse = [];
        trips.forEach(trip => {
            if (req.body.getAll || (trip.riders.length < trip.max_riders)) {
                var tripResponse = {
                    ...trip
                }
                tripResponse["driverDetails"] = trip.driverDetails[0]

                tripsResponse.push(tripResponse);
            }
        })
        return res.status(200).json({ trips: tripsResponse });
    })
}

exports.requestRide = (req, res) => {
    Trip.findById(req.body.trip, (err, tripData) => {
        const tripRequestObj = new TripRequest({
            rider: req.auth._id,
            driver: req.body.driver,
            source: tripData.source,
            destination: tripData.destination,
            trip: req.body.trip,
            pickUpPoints: [...tripData.waypoints, req.body.src, req.body.dst],
            riderName: req.body.riderName,
            pickUpTime: req.body.pickUpTime ? new Date(req.body.pickUpTime) : null
        });
        tripRequestObj.save((err, tripRequest) => {
            console.log(req.body.riderName)
            if (err) {
                console.log(err)
                return res.status(500).end();
            }
            return res.status(200).json(tripRequest);
        })
    })
}

exports.driveRequests = (req, res) => {
    TripRequest.find(
        {
            $match: {
                "driver": { $elemMatch: { _id: req.auth._id } },
                "status": req.body.status,
                "trip.dateTime": { "$gte": new Date().toISOString() }
            },
        }
        , (err, requests) => {
            var rideRequests = [];
            requests.forEach(request => {
                var requestDto = {
                    ...request._doc
                }

                rideRequests.push(requestDto);
            })
            return res.status(200).json({ rideRequests });
        })
}

exports.rideRequests = (req, res) => {
    TripRequest.find(
        {
            $match: {
                "rider": { $elemMatch: { _id: req.auth._id } },
                "status": req.body.status,
                "trip.dateTime": { "$gte": new Date().toISOString() }
            },
        }
        , (err, requests) => {
            var rideRequests = [];
            requests.forEach(request => {

                var requestDto = {
                    ...request._doc
                }

                rideRequests.push(requestDto);
            })
            return res.status(200).json({ rideRequests });
        })
}

exports.updateRequest = (req, res) => {
    var action = req.body.action || "accepted"

    TripRequest.findById(req.body.tripRequest, (err, tripRequest) => {
        tripRequest.status = req.body.action
        tripRequest.save((err, tr) => {
            Trip.findById(req.body.trip, (err, trip) => {
                // if (trip == null || trip.available_riders <= 0) {
                //     return res.status(200).json({ "msg": "Trip is filled" })
                // }
                // if (trip.dateTime > new Date()) {
                //     return res.status(200).json({ "msg": "Trip is completed" })
                // }
                // if (action == "accepted") {
                //     trip.riders = [...trip.riders, tripRequest.rider]
                //     trip.waypoints = [tripRequest.source, tripRequest.destination, trip.source, trip.destination]
                // } else {
                //     var index = trip.riders.indexOf(tripRequest.rider)
                //     if (index > -1) {
                //         trip.riders = trip.riders.splice(index, 1)
                //     }
                // }
                // trip.save((err, trip) => {
                //     var msg = (action == "accepted") ? "Trip Accepted successfully" : "Trip Rejected successfully"
                //     return res.status(200).json({ msg })
                // })
            })
            var msg = (action == "accepted" ) ? "Trip Accepted" : "Trip Rejected"
            return res.status(200).json({ msg })
        })
    })
}