const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Area = require('./models/Area');
const PickupRequest = require('./models/PickupRequest');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
    await connectDB();
    try {
        // Clear existing data
        await User.deleteMany();
        await Area.deleteMany();
        await PickupRequest.deleteMany();

        console.log('Data cleared!');

        // Create users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
            phone: '+1234567890'
        });

        const worker1 = await User.create({
            name: 'John Worker',
            email: 'worker@example.com',
            password: 'password123',
            role: 'worker',
            phone: '+1234567891',
            availability: true
        });

        const worker2 = await User.create({
            name: 'Jane Worker',
            email: 'worker2@example.com',
            password: 'password123',
            role: 'worker',
            phone: '+1234567892',
            availability: true
        });

        const citizen1 = await User.create({
            name: 'Citizen One',
            email: 'citizen@example.com',
            password: 'password123',
            role: 'citizen',
            phone: '+1234567893'
        });

        const citizen2 = await User.create({
            name: 'Citizen Two',
            email: 'citizen2@example.com',
            password: 'password123',
            role: 'citizen',
            phone: '+1234567894'
        });

        console.log('Users created!');

        // Create areas with zones
        const downtown = await Area.create({
            name: 'Downtown',
            city: 'Metro City',
            zone: 'Zone A',
            location: { type: 'Point', coordinates: [77.5946, 12.9716] },
            priorityLevel: 'High',
            assignedWorkers: [worker1._id]
        });

        const suburbs = await Area.create({
            name: 'Suburbs',
            city: 'Metro City',
            zone: 'Zone B',
            location: { type: 'Point', coordinates: [77.6408, 12.9698] },
            priorityLevel: 'Medium',
            assignedWorkers: [worker2._id]
        });

        const industrial = await Area.create({
            name: 'Industrial Zone',
            city: 'Metro City',
            zone: 'Zone C',
            location: { type: 'Point', coordinates: [77.5385, 13.0827] },
            priorityLevel: 'Low',
            assignedWorkers: [worker1._id, worker2._id]
        });

        console.log('Areas created!');

        // Update workers with assigned areas
        worker1.assignedArea = downtown._id;
        await worker1.save();

        worker2.assignedArea = suburbs._id;
        await worker2.save();

        // Create sample pickup requests
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const request1 = await PickupRequest.create({
            user: citizen1._id,
            area: downtown._id,
            garbageType: 'Wet',
            description: 'Kitchen waste from restaurant',
            scheduledDate: tomorrow,
            timeSlot: 'Morning (6AM-10AM)',
            status: 'Requested',
            priority: 'High',
            location: {
                address: '123 Main St, Downtown',
                coordinates: [77.5946, 12.9716]
            }
        });

        const request2 = await PickupRequest.create({
            user: citizen2._id,
            area: suburbs._id,
            garbageType: 'Dry',
            description: 'Paper and cardboard boxes',
            scheduledDate: tomorrow,
            timeSlot: 'Afternoon (10AM-2PM)',
            status: 'Assigned',
            assignedWorker: worker2._id,
            priority: 'Medium',
            location: {
                address: '456 Oak Ave, Suburbs',
                coordinates: [77.6408, 12.9698]
            }
        });

        const request3 = await PickupRequest.create({
            user: citizen1._id,
            area: downtown._id,
            garbageType: 'Mixed',
            description: 'General household waste',
            scheduledDate: tomorrow,
            timeSlot: 'Evening (2PM-6PM)',
            status: 'Accepted',
            assignedWorker: worker1._id,
            priority: 'Medium',
            location: {
                address: '789 Park Rd, Downtown',
                coordinates: [77.5946, 12.9716]
            }
        });

        const request4 = await PickupRequest.create({
            user: citizen2._id,
            area: industrial._id,
            garbageType: 'E-Waste',
            description: 'Old electronics and batteries',
            scheduledDate: tomorrow,
            timeSlot: 'Morning (6AM-10AM)',
            status: 'OnTheWay',
            assignedWorker: worker1._id,
            priority: 'Urgent',
            location: {
                address: '321 Factory Lane, Industrial',
                coordinates: [77.5385, 13.0827]
            }
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const request5 = await PickupRequest.create({
            user: citizen1._id,
            area: suburbs._id,
            garbageType: 'Wet',
            description: 'Garden waste',
            scheduledDate: yesterday,
            timeSlot: 'Afternoon (10AM-2PM)',
            status: 'Completed',
            assignedWorker: worker2._id,
            priority: 'Low',
            completedAt: new Date(),
            location: {
                address: '555 Green St, Suburbs',
                coordinates: [77.6408, 12.9698]
            }
        });

        console.log('Pickup requests created!');
        console.log('\n=== SEED DATA SUMMARY ===');
        console.log('Users:');
        console.log(`  Admin: ${admin.email} / password123`);
        console.log(`  Worker 1: ${worker1.email} / password123 (Area: Downtown)`);
        console.log(`  Worker 2: ${worker2.email} / password123 (Area: Suburbs)`);
        console.log(`  Citizen 1: ${citizen1.email} / password123`);
        console.log(`  Citizen 2: ${citizen2.email} / password123`);
        console.log('\nAreas: 3 (Downtown, Suburbs, Industrial Zone)');
        console.log('Pickup Requests: 5 (various statuses)');
        console.log('========================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
