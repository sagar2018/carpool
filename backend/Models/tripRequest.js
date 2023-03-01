const mongoose = require("mongoose");
const schema = mongoose.Schema;
const tripRequestSchema = new schema({
    driver: {
        type: mongoose.ObjectId,
        require: true,
    },
    source: {
        type: Object,
        required: true,
    },
    destination: {
        type: Object,
        required: true,
    },
    waypoints: {
        type: Array,
        required: false,
    },
    route: {
        type: Array
    },
    rider: {
        type: mongoose.ObjectId,
        require: true,
    },
    trip: {
        type: mongoose.ObjectId,
        require: true,
    },
    dateTime: {
        type: Date,
        required: true,
    },
    state: {
        type: String,
        default: "pending"
    },
}, { timestamps: true });

module.exports = mongoose.model("tripRequest", tripRequestSchema)