const mongoose = require('mongoose');

const problemSchema = mongoose.Schema({
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    areaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    wasteCategory: {
        type: String,
        enum: ['Wet', 'Dry', 'Mixed', 'E-Waste', 'Hazardous'],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    description: {
        type: String,
        required: true
    },
    photo: {
        type: String, // Path to uploaded image
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Scheduled', 'Resolved'],
        default: 'Pending'
    },
    scheduledPickupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickupRequest',
        default: null
    }
}, {
    timestamps: true
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
