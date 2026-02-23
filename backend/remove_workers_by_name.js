const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Area = require('./models/Area');
const PickupRequest = require('./models/PickupRequest');
const connectDB = require('./config/db');

dotenv.config();

const removeWorkersByName = async () => {
    await connectDB();
    try {
        const targetNames = ['Available Worker', 'Unavailable Worker'];

        console.log(`Searching for workers: ${targetNames.join(', ')}...`);

        // Case insensitive search
        const workers = await User.find({
            name: { $in: targetNames.map(name => new RegExp(`^${name}$`, 'i')) }
        });

        if (workers.length === 0) {
            console.log('No matching workers found.');
            process.exit(0);
        }

        const workerIds = workers.map(w => w._id);
        console.log(`Found ${workers.length} workers:`);
        workers.forEach(w => console.log(`- ${w.name} (${w.email})`));

        // 1. Remove from Areas
        console.log('Removing workers from Areas...');
        const areaUpdateResult = await Area.updateMany(
            { assignedWorkers: { $in: workerIds } },
            { $pull: { assignedWorkers: { $in: workerIds } } }
        );
        console.log(`Updated ${areaUpdateResult.modifiedCount} areas.`);

        // 2. Unassign from PickupRequests
        console.log('Unassigning from pickup requests...');
        const revertStatusResult = await PickupRequest.updateMany(
            { assignedWorker: { $in: workerIds }, status: { $in: ['Assigned', 'Accepted', 'OnTheWay'] } },
            { $set: { assignedWorker: null, status: 'Pending' } }
        );
        console.log(`Reverted status for ${revertStatusResult.modifiedCount} active requests.`);

        const nullifyWorkerResult = await PickupRequest.updateMany(
            { assignedWorker: { $in: workerIds }, status: { $nin: ['Assigned', 'Accepted', 'OnTheWay', 'Pending'] } },
            { $set: { assignedWorker: null } }
        );
        console.log(`Nullified worker for ${nullifyWorkerResult.modifiedCount} other requests.`);

        // 3. Delete Users
        console.log('Deleting user documents...');
        const deleteResult = await User.deleteMany({ _id: { $in: workerIds } });
        console.log(`Deleted ${deleteResult.deletedCount} users.`);

        console.log('Workers removed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error removing workers:', error);
        process.exit(1);
    }
};

removeWorkersByName();
