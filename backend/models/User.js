const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'worker', 'citizen'],
        default: 'citizen'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    assignedArea: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Area',
        default: null
    },
    availabilityStatus: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online'
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    dlNumber: {
        type: String,
        required: function () { return this.role === 'worker'; }
    },
    dlPhoto: {
        type: String,
        required: function () { return this.role === 'worker'; }
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending'
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
