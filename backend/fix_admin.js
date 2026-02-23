const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const fixAdmin = async () => {
    await connectDB();
    try {
        const adminEmail = 'admin@example.com';
        const admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user exists. Updating password...');
            admin.password = 'password123';
            await admin.save();
            console.log('Admin password updated.');
        } else {
            console.log('Admin user not found. Creating...');
            await User.create({
                name: 'Admin User',
                email: adminEmail,
                password: 'password123',
                role: 'admin',
                phone: '+1234567890'
            });
            console.log('Admin user created.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing admin:', error);
        process.exit(1);
    }
};

fixAdmin();
