const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    binId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
        default: null
    },
    areaId: {
        type: mongoose.Schema.Types.ObjectId, // Optional: if bin not known, select area
        ref: 'Area',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String, // Path to uploaded image
        default: null
    },
    garbageStatus: {
        type: String,
        enum: ['Picked Up', 'Not Picked Up'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rescheduled'],
        default: 'Pending'
    },
    pickupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickupRequest',
        default: null
    },
    rescheduledPickupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickupRequest',
        default: null
    }
}, {
    timestamps: true
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
