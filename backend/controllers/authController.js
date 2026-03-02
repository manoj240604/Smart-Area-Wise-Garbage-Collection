const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const authUser = async (req, res) => {
    const { email, password } = req.body;

    // 1. ADMIN CHECK (using environment variables)
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const adminUser = await User.findOne({ email });
        if (adminUser) {
            return res.json({
                _id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
                phone: adminUser.phone,
                assignedArea: adminUser.assignedArea,
                availabilityStatus: adminUser.availabilityStatus,
                token: generateToken(adminUser._id)
            });
        }
    }

    // 2. STANDARD LOGIN
    const user = await User.findOne({ email });

    // 3. BLOCK ADMIN FROM STANDARD LOGIN
    if (user && user.role === 'admin') {
        return res.status(401).send('Invalid admin credentials');
    }

    // 4. DRIVER VERIFICATION CHECK
    if (user && user.role === 'worker') {
        if (user.verificationStatus === 'Pending') {
            return res.status(403).json({ message: 'Please wait. Verification is in progress.' });
        }
        if (user.verificationStatus === 'Rejected') {
            return res.status(403).json({ message: 'Your account has been rejected by Admin.' });
        }
    }

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            assignedArea: user.assignedArea,
            availabilityStatus: user.availabilityStatus,
            verificationStatus: user.verificationStatus, // Send status to frontend
            token: generateToken(user._id)
        });
    } else {
        res.status(401).send('Invalid email or password');
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin only depending on logic, keeping public for easier demo)
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, dlNumber } = req.body;
    let dlPhoto = '';

    if (role === 'admin') {
        res.status(403);
        throw new Error('Admin registration is restricted');
    }

    if (role === 'worker') {
        if (!req.file) {
            res.status(400);
            throw new Error('Driving Licence photo is required for workers');
        }
        dlPhoto = '/uploads/' + req.file.filename;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).send('User already exists');
        return;
    }

    const userData = {
        name,
        email,
        password,
        phone,
        role: role || 'citizen',
        dlNumber: role === 'worker' ? dlNumber : undefined,
        dlPhoto: role === 'worker' ? dlPhoto : undefined,
        verificationStatus: role === 'worker' ? 'Pending' : 'Verified',
        isVerified: role !== 'worker' // Citizens are auto-verified
    };

    const user = await User.create(userData);

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            verificationStatus: user.verificationStatus,
            token: generateToken(user._id)
        });
    } else {
        res.status(400).send('Invalid user data');
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        console.log('Update Profile Request:', req.body);
        console.log('User ID:', req.user._id);

        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;

            if (req.body.password && req.body.password.trim() !== '') {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            console.log('Profile Updated Successfully:', updatedUser);

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address,
                availabilityStatus: updatedUser.availabilityStatus,
                token: generateToken(updatedUser._id)
            });
        } else {
            console.error('User not found in database');
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server Error during profile update' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify or Reject Worker
// @route   PUT /api/auth/verify-worker/:id
// @access  Admin
const verifyWorker = async (req, res, next) => {
    const { status } = req.body; // 'Verified' or 'Rejected'
    console.log(`Verifying worker ${req.params.id} with status ${status}`);

    try {
        // Use findByIdAndUpdate to bypass schema validation (like missing dlPhoto on legacy users)
        // and bypass pre-save hooks to avoid "next is not a function" error
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                verificationStatus: status,
                isVerified: status === 'Verified'
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Worker not found' });
        }

        if (updatedUser.role !== 'worker') {
            return res.status(400).json({ message: 'User is not a worker' });
        }

        res.json({
            message: `Worker ${status} successfully`,
            _id: updatedUser._id,
            status: updatedUser.verificationStatus
        });
    } catch (error) {
        console.error('Verify Worker Error:', error);
        res.status(500).json({ message: error.message || 'Error verifying worker' });
    }
};

module.exports = { authUser, registerUser, updateUserProfile, getProfile, verifyWorker };
