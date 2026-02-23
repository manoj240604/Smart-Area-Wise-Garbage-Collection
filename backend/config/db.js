const mongoose = require('mongoose');
const PickupRequest = require('../models/PickupRequest');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Drop legacy 2dsphere index on location.type (was invalid - caused "Can't extract geo keys" error)
        try {
            const indexes = await PickupRequest.collection.indexes();
            const badIndex = indexes.find(i => i.key && i.key['location.type'] === '2dsphere');
            if (badIndex) {
                await PickupRequest.collection.dropIndex(badIndex.name);
                console.log(`Dropped invalid geo index: ${badIndex.name}`);
            }
        } catch (e) {
            // Ignore - index may not exist
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
