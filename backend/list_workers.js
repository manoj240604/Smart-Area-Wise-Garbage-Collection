const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const listWorkers = async () => {
    await connectDB();
    try {
        const workers = await User.find({ role: 'worker' });
        console.log('--- ALL WORKERS ---');
        workers.forEach(w => {
            console.log(`Name: "${w.name}", Email: "${w.email}", ID: ${w._id}`);
        });
        console.log('-------------------');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listWorkers();
