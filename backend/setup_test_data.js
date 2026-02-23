const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const setupData = async () => {
    await connectDB();
    try {
        // Create an unavailable worker
        await User.create({
            name: 'Unavailable Worker',
            email: 'unavailable@example.com',
            password: 'password123',
            role: 'worker',
            availability: false
        });
        console.log('Created unavailable worker.');

        // Create an available worker
        await User.create({
            name: 'Available Worker',
            email: 'available@example.com',
            password: 'password123',
            role: 'worker',
            availability: true
        });
        console.log('Created available worker.');

        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log('Workers already exist.');
            process.exit(0);
        }
        console.error('Error setting up data:', error);
        process.exit(1);
    }
};

setupData();
