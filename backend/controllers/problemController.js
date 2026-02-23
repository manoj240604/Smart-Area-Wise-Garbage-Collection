const Problem = require('../models/Problem');
const PickupRequest = require('../models/PickupRequest');
const Notification = require('../models/Notification');

// @desc    Report a problem
// @route   POST /api/problems
// @access  Citizen
const reportProblem = async (req, res) => {
    // Better extraction for multipart/form-data
    const areaId = req.body.areaId;
    const wasteCategory = req.body.wasteCategory;
    const description = req.body.description;
    const address = req.body['location[address]'] || (req.body.location && req.body.location.address);
    const coordinates = req.body['location[coordinates]'] || (req.body.location && req.body.location.coordinates);

    let photo = null;
    if (req.file) {
        photo = `/uploads/${req.file.filename}`;
    }

    // Coordinates parsing
    let parsedCoordinates = [72.8777, 19.0760];
    try {
        if (coordinates) {
            parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
        }
    } catch (e) {
        console.error('Error parsing coordinates:', e);
    }

    // Explicit validation before Mongoose
    if (!address || address === '' || address === 'Address not found') {
        return res.status(400).json({ message: 'A valid location address is required. Please pinpoint the location on the map.' });
    }

    try {
        const problem = new Problem({
            citizenId: req.user._id,
            areaId,
            wasteCategory,
            description,
            location: {
                type: 'Point',
                coordinates: parsedCoordinates,
                address: address || ''
            },
            photo
        });

        const createdProblem = await problem.save();

        // Notify Citizen
        const citizenNotification = await Notification.create({
            user: req.user._id,
            title: 'Problem Reported',
            message: `Your report regarding ${wasteCategory} waste has been received. ID: #${createdProblem._id.toString().slice(-6).toUpperCase()}`,
            type: 'Info'
        });

        // Emit for Real-time
        const io = req.app.get('socketio');
        if (io) {
            const populatedProblem = await Problem.findById(createdProblem._id)
                .populate('citizenId', 'name email phone')
                .populate('areaId', 'name zone');
            io.emit('newProblem', populatedProblem);
            io.emit('analyticsUpdate', { type: 'problemCreated' });

            // Emit notification to citizen
            io.to(req.user._id.toString()).emit('newNotification', {
                _id: citizenNotification._id,
                title: citizenNotification.title,
                message: citizenNotification.message,
                type: citizenNotification.type,
                relatedRequest: null,
                createdAt: citizenNotification.createdAt,
                read: false
            });
        }

        res.status(201).json(createdProblem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all problems
// @route   GET /api/problems
// @access  Admin
const getAllProblems = async (req, res) => {
    try {
        const problems = await Problem.find({})
            .populate('citizenId', 'name email phone')
            .populate('areaId', 'name zone')
            .populate('scheduledPickupId')
            .sort({ createdAt: -1 });
        res.json(problems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Schedule pickup for a problem
// @route   POST /api/problems/:id/schedule
// @access  Admin
const schedulePickupForProblem = async (req, res) => {
    const { scheduledDate, timeSlot, workerId } = req.body;

    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        // Create new pickup request
        const newPickup = await PickupRequest.create({
            user: problem.citizenId,
            area: problem.areaId,
            garbageType: problem.wasteCategory,
            description: `[Scheduled from Reported Problem] ${problem.description}`,
            scheduledDate,
            timeSlot,
            location: problem.location,
            assignedWorker: workerId || null,
            status: workerId ? 'Assigned' : 'Requested',
            priority: 'High',
            complaintId: null, // This is a Problem, not a Complaint
            problemId: problem._id
        });

        // Update Problem
        problem.status = 'Scheduled';
        problem.scheduledPickupId = newPickup._id;
        await problem.save();

        // Notify Citizen
        await Notification.create({
            user: problem.citizenId,
            title: 'Pickup Scheduled',
            message: `A pickup has been scheduled for your reported problem on ${new Date(scheduledDate).toLocaleDateString()}.`,
            type: 'Success',
            relatedRequest: newPickup._id
        });

        // Emit for real-time
        const io = req.app.get('socketio');
        if (io) {
            const populatedProblem = await Problem.findById(problem._id)
                .populate('citizenId', 'name email phone')
                .populate('areaId', 'name zone')
                .populate('scheduledPickupId');

            const populatedPickup = await PickupRequest.findById(newPickup._id)
                .populate('user', 'name email phone')
                .populate('area', 'name zone')
                .populate('assignedWorker', 'name phone');

            io.emit('problemUpdate', populatedProblem);
            io.emit('newAssignment', populatedPickup); // For worker if assigned
            io.emit('requestUpdate', populatedPickup); // For citizen
            io.emit('analyticsUpdate', { type: 'pickupCreated', fromProblem: true });
        }

        res.json({ problem, pickup: newPickup });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    reportProblem,
    getAllProblems,
    schedulePickupForProblem
};
