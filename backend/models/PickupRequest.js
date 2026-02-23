const mongoose = require('mongoose');

const pickupRequestSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        default: null
    },
    garbageType: {
        type: String,
        enum: ['Wet', 'Dry', 'Mixed', 'E-Waste', 'Hazardous'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: null
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        enum: ['Morning (6AM-10AM)', 'Afternoon (10AM-2PM)', 'Evening (2PM-6PM)', 'Night (6PM-10PM)'],
        required: true
    },
    status: {
        type: String,
        enum: ['Requested', 'Assigned', 'Accepted', 'OnTheWay', 'PickedUp', 'Completed', 'Cancelled'],
        default: 'Requested'
    },
    assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    completedAt: {
        type: Date,
        default: null
    },
    assignedAt: {
        type: Date,
        default: null
    },
    isEmergency: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    },
    complaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null
    },
    originalPickupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickupRequest',
        default: null
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
pickupRequestSchema.index({ status: 1, scheduledDate: 1 });
pickupRequestSchema.index({ assignedWorker: 1, status: 1 });
pickupRequestSchema.index({ area: 1, status: 1 });

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);

module.exports = PickupRequest;
