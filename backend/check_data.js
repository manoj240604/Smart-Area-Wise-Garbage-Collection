const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const checkData = async () => {
    await connectDB();
    try {
        const workers = await User.find({ role: 'worker' });
        const available = workers.filter(w => w.availability === true).length;
        const unavailable = workers.filter(w => w.availability === false).length;

        console.log(`TOTAL:${workers.length},AVAIL:${available},UNAVAIL:${unavailable}`);

        if (unavailable > 0) {
            console.log("SUCCESS: Unavailable workers exist.");
            process.exit(0);
        } else {
            console.log("FAILURE: No unavailable workers found.");
            process.exit(1);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
