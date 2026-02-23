const mongoose = require('mongoose');

const binSchema = mongoose.Schema({
    binId: {
        type: String,
        required: true,
        unique: true
    },
    areaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        required: true
    },
    garbageLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['Normal', 'Full', 'Overflowing'],
        default: 'Normal'
    },
    lastCollectedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Middleware to update status based on garbageLevel
binSchema.pre('save', function (next) {
    if (this.garbageLevel >= 90) {
        this.status = 'Overflowing';
    } else if (this.garbageLevel >= 80) {
        this.status = 'Full';
    } else {
        this.status = 'Normal';
    }
    next();
});

const Bin = mongoose.model('Bin', binSchema);

module.exports = Bin;
