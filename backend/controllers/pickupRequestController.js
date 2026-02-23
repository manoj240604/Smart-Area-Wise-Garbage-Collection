const mongoose = require('mongoose');
const PickupRequest = require('../models/PickupRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a new pickup request
exports.createPickupRequest = async (req, res) => {
    try {
        let { area, garbageType, description, scheduledDate, timeSlot, location, priority, isEmergency } = req.body;

        // Area is optional - for display/reference only (citizen, admin, driver)
        const areaId = (area && mongoose.Types.ObjectId.isValid(area)) ? area : null;

        // Robust parsing for multipart/form-data with nested location fields
        let processedLocation = null;
        const rawCoords = location?.coordinates ?? req.body['location[coordinates]'] ?? req.body?.location?.coordinates;
        const rawAddress = location?.address ?? req.body['location[address]'] ?? req.body?.location?.address ?? '';

        const parseCoordinates = (val) => {
            if (!val) return [72.8777, 19.0760];
            if (Array.isArray(val) && val.length >= 2) {
                return val.map(c => typeof c === 'string' ? parseFloat(c) : Number(c)).filter(n => !isNaN(n));
            }
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    return parseCoordinates(parsed);
                } catch {
                    const nums = val.match(/-?\d+\.?\d*/g);
                    return nums && nums.length >= 2 ? nums.slice(0, 2).map(Number) : [72.8777, 19.0760];
                }
            }
            return [72.8777, 19.0760];
        };

        if (location && typeof location === 'object' && !req.body['location[address]']) {
            processedLocation = typeof location === 'string' ? JSON.parse(location) : {
                type: 'Point',
                address: location.address || rawAddress,
                coordinates: parseCoordinates(location.coordinates || rawCoords)
            };
        } else if (rawAddress || rawCoords) {
            processedLocation = {
                type: 'Point',
                address: rawAddress || 'Pickup location',
                coordinates: parseCoordinates(rawCoords)
            };
        }

        if (!processedLocation) {
            processedLocation = {
                type: 'Point',
                address: 'Pickup location',
                coordinates: [72.8777, 19.0760]
            };
        }

        const pickupRequest = await PickupRequest.create({
            user: req.user._id,
            area: areaId,
            garbageType,
            description,
            scheduledDate,
            timeSlot,
            location: processedLocation,
            priority: isEmergency ? 'Urgent' : (priority || 'Medium'),
            isEmergency: isEmergency || false,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        });

        // Create notification for admin
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                user: admin._id,
                title: isEmergency ? '🚨 URGENT: Emergency Pickup' : 'New Pickup Request',
                message: `${isEmergency ? '[URGENT] ' : ''}New ${garbageType} garbage pickup request`,
                type: isEmergency ? 'Error' : 'Info',
                relatedRequest: pickupRequest._id
            });
        }

        // Fetch populated request for real-time frontend update
        const populatedRequest = await PickupRequest.findById(pickupRequest._id)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone availabilityStatus');

        const io = req.app.get('socketio');
        if (io) {
            io.emit('requestUpdate', populatedRequest);
            io.emit('analyticsUpdate', { type: 'pickupCreated', isEmergency });
        }

        res.status(201).json(pickupRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user's pickup requests
exports.getUserRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { user: req.user._id };

        if (status) {
            filter.status = status;
        }

        const requests = await PickupRequest.find(filter)
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone')
            .populate('originalPickupId', 'scheduledDate timeSlot')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all pickup requests (Admin)
exports.getAllRequests = async (req, res) => {
    try {
        const { status, area, date } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (area) filter.area = area;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.scheduledDate = { $gte: startDate, $lt: endDate };
        }

        const requests = await PickupRequest.find(filter)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone availabilityStatus')
            .sort({ scheduledDate: -1, createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign worker to request (Admin)
exports.assignWorker = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { workerId } = req.body;

        const request = await PickupRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const worker = await User.findById(workerId);
        if (!worker || worker.role !== 'worker') {
            return res.status(400).json({ message: 'Invalid worker' });
        }

        request.assignedWorker = workerId;
        request.status = 'Assigned';
        request.assignedAt = new Date();
        await request.save();

        // Fetch populated request for real-time frontend update
        const populatedRequest = await PickupRequest.findById(request._id)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone availabilityStatus');

        // Notify worker
        await Notification.create({
            user: workerId,
            title: 'New Task Assigned',
            message: `You have been assigned a ${request.garbageType} pickup task`,
            type: 'Info',
            relatedRequest: request._id
        });

        // Notify citizen
        const orderId = request._id.toString().slice(-6).toUpperCase();
        const citizenNotification = await Notification.create({
            user: request.user,
            title: `Order ID: #${orderId}`,
            message: `Your pickup request status: Assigned`,
            type: 'StatusUpdate',
            relatedRequest: request._id
        });

        // Emit notification to citizen
        const io = req.app.get('socketio');
        if (io) {
            io.to(request.user.toString()).emit('newNotification', {
                _id: citizenNotification._id,
                title: citizenNotification.title,
                message: citizenNotification.message,
                type: citizenNotification.type,
                relatedRequest: citizenNotification.relatedRequest,
                createdAt: citizenNotification.createdAt,
                read: false
            });

            io.emit('requestUpdate', populatedRequest);
            io.to(workerId).emit('newAssignment', populatedRequest);
        }

        res.json(populatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update request status
exports.updateStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        const validTransitions = {
            'Requested': ['Assigned', 'Cancelled'],
            'Assigned': ['Accepted', 'Cancelled'],
            'Accepted': ['OnTheWay', 'Cancelled'],
            'OnTheWay': ['PickedUp'],
            'PickedUp': ['Completed'],
            'Completed': [],
            'Cancelled': []
        };

        const request = await PickupRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Validate status transition
        if (!validTransitions[request.status].includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from ${request.status} to ${status}`
            });
        }

        request.status = status;
        if (status === 'Completed') {
            request.completedAt = new Date();
        }
        await request.save();

        // Fetch populated request for real-time frontend update
        const populatedRequest = await PickupRequest.findById(request._id)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone availabilityStatus');

        // Notify citizen
        const orderId = request._id.toString().slice(-6).toUpperCase();
        const citizenNotification = await Notification.create({
            user: request.user,
            title: `Order ID: #${orderId}`,
            message: `Your pickup request status: ${status}`,
            type: 'StatusUpdate',
            relatedRequest: request._id
        });

        // Emit notification to citizen
        const io = req.app.get('socketio');
        if (io) {
            io.to(request.user.toString()).emit('newNotification', {
                _id: citizenNotification._id,
                title: citizenNotification.title,
                message: citizenNotification.message,
                type: citizenNotification.type,
                relatedRequest: citizenNotification.relatedRequest,
                createdAt: citizenNotification.createdAt,
                read: false
            });

            io.emit('requestUpdate', populatedRequest);
            if (status === 'Completed') {
                io.emit('analyticsUpdate', { type: 'pickupCompleted' });
            }
        }

        res.json(populatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Rate a pickup request
exports.rateRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rating, feedback } = req.body;

        const request = await PickupRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'Completed') {
            return res.status(400).json({ message: 'Only completed requests can be rated' });
        }

        if (request.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to rate this request' });
        }

        request.rating = rating;
        request.feedback = feedback;
        await request.save();

        const populatedRequest = await PickupRequest.findById(request._id)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone')
            .populate('assignedWorker', 'name phone availabilityStatus');

        const io = req.app.get('socketio');
        if (io) {
            io.emit('requestUpdate', populatedRequest);
            io.emit('ratingSubmitted', { requestId: request._id, rating, workerId: request.assignedWorker });
        }

        res.json(populatedRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRequestById = async (req, res) => {
    try {
        const request = await PickupRequest.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('area', 'name city zone location')
            .populate('assignedWorker', 'name phone');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get dashboard statistics (Admin)
exports.getStatistics = async (req, res) => {
    try {
        const totalRequests = await PickupRequest.countDocuments();
        const pendingRequests = await PickupRequest.countDocuments({
            status: { $in: ['Requested', 'Assigned', 'Accepted', 'OnTheWay', 'PickedUp'] }
        });
        const completedToday = await PickupRequest.countDocuments({
            status: 'Completed',
            completedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });

        const areaStats = await PickupRequest.aggregate([
            {
                $group: {
                    _id: '$area',
                    total: { $sum: 1 },
                    pending: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['Requested', 'Assigned', 'Accepted', 'OnTheWay', 'PickedUp']] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'areas',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'areaInfo'
                }
            }
        ]);

        res.json({
            totalRequests,
            pendingRequests,
            completedToday,
            areaStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
