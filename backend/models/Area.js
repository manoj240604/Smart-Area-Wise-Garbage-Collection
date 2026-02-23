const mongoose = require('mongoose');

const areaSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true,
        default: 'Default City'
    },
    zone: {
        type: String,
        required: true,
        default: 'Zone A'
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
        }
    },
    priorityLevel: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    assignedWorkers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

areaSchema.index({ location: '2dsphere' });

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;
