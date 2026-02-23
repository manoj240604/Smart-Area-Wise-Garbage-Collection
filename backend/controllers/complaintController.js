const Complaint = require('../models/Complaint');

// @desc    Create a complaint
// @route   POST /api/complaints
// @access  Citizen
const createComplaint = async (req, res) => {
    const { areaId, description, binId, garbageStatus, pickupId } = req.body;
    let finalImageUrl = req.body.imageUrl;

    if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
    }

    try {
        const complaint = new Complaint({
            citizenId: req.user._id,
            areaId,
            binId,
            description,
            imageUrl: finalImageUrl,
            garbageStatus,
            pickupId
        });

        const createdComplaint = await complaint.save();

        // Trigger Notification for Citizen
        const Notification = require('../models/Notification');
        const citizenNotification = await Notification.create({
            user: req.user._id,
            title: 'Complaint Submitted',
            message: `Your complaint regarding ${garbageStatus} garbage has been submitted successfully tracking ID: #${createdComplaint._id.toString().slice(-6).toUpperCase()}.`,
            type: 'Complaint',
            relatedRequest: pickupId || null
        });

        // Emit socket event for real-time update
        const populatedComplaint = await Complaint.findById(createdComplaint._id)
            .populate('citizenId', 'name email phone')
            .populate('areaId', 'name zone')
            .populate({
                path: 'pickupId',
                populate: { path: 'assignedWorker', select: 'name' }
            });

        const io = req.app.get('socketio');
        if (io) {
            io.emit('complaintUpdate', populatedComplaint);
            io.emit('analyticsUpdate', { type: 'complaintCreated' });

            // Emit notification to citizen
            io.to(req.user._id.toString()).emit('newNotification', {
                _id: citizenNotification._id,
                title: citizenNotification.title,
                message: citizenNotification.message,
                type: citizenNotification.type,
                relatedRequest: citizenNotification.relatedRequest,
                createdAt: citizenNotification.createdAt,
                read: false
            });
        }

        res.status(201).json(createdComplaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my complaints
// @route   GET /api/complaints/my
// @access  Citizen
const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ citizenId: req.user._id }).populate('areaId', 'name');
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Admin
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({})
            .populate('citizenId', 'name email phone')
            .populate('areaId', 'name zone')
            .populate({
                path: 'pickupId',
                populate: { path: 'assignedWorker', select: 'name' }
            })
            .populate({
                path: 'rescheduledPickupId',
                populate: { path: 'assignedWorker', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id
// @access  Admin
const updateComplaintStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);
        const Notification = require('../models/Notification'); // Lazy load to avoid circular dependency if any

        if (complaint) {
            complaint.status = status;
            const updatedComplaint = await complaint.save();

            // Notify Citizen
            await Notification.create({
                user: complaint.citizenId,
                title: `Complaint ${status}`,
                message: `Your complaint regarding ${complaint.garbageStatus} garbage has been marked as ${status}.`,
                type: status === 'Resolved' ? 'Success' : 'Info',
                relatedRequest: null // It's a complaint, not a pickup request
            });

            // Emit socket event for real-time update
            const populatedComplaint = await Complaint.findById(updatedComplaint._id)
                .populate('citizenId', 'name email phone')
                .populate('areaId', 'name zone')
                .populate({
                    path: 'pickupId',
                    populate: { path: 'assignedWorker', select: 'name' }
                });

            const io = req.app.get('socketio');
            if (io) {
                io.emit('complaintUpdate', populatedComplaint);
            }

            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Reschedule a complaint
// @route   PUT /api/complaints/:id/reschedule
// @access  Admin
const rescheduleComplaint = async (req, res) => {
    const { scheduledDate, timeSlot } = req.body;
    const PickupRequest = require('../models/PickupRequest');
    const Notification = require('../models/Notification');

    try {
        const complaint = await Complaint.findById(req.params.id).populate('pickupId');
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const originalPickup = complaint.pickupId;
        if (!originalPickup) {
            return res.status(400).json({ message: 'No linked pickup found to reschedule' });
        }

        // Create a new pickup request based on the original one
        const newPickup = await PickupRequest.create({
            user: originalPickup.user,
            area: originalPickup.area,
            garbageType: originalPickup.garbageType,
            description: `[Rescheduled from Complaint] ${originalPickup.description}`,
            scheduledDate,
            timeSlot,
            location: originalPickup.location,
            priority: 'High', // Escalated priority for rescheduled pickups
            originalPickupId: originalPickup._id, // Add this if exists in model, else just note it in description
            complaintId: complaint._id
        });

        complaint.status = 'Rescheduled';
        complaint.rescheduledPickupId = newPickup._id;
        await complaint.save();

        // Notify Citizen
        await Notification.create({
            user: complaint.citizenId,
            title: 'Pickup Rescheduled',
            message: `Your complaint has been addressed. A new pickup is scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${timeSlot}.`,
            type: 'Info',
            relatedRequest: newPickup._id
        });

        // Emit socket events for real-time update
        const io = req.app.get('socketio');
        if (io) {
            const populatedComplaint = await Complaint.findById(complaint._id)
                .populate('citizenId', 'name email phone')
                .populate('areaId', 'name zone')
                .populate({
                    path: 'pickupId',
                    populate: { path: 'assignedWorker', select: 'name' }
                })
                .populate({
                    path: 'rescheduledPickupId',
                    populate: { path: 'assignedWorker', select: 'name' }
                });

            const populatedRequest = await require('../models/PickupRequest').findById(newPickup._id)
                .populate('user', 'name email phone')
                .populate('area', 'name city zone')
                .populate('assignedWorker', 'name phone availability');

            io.emit('complaintUpdate', populatedComplaint);
            io.emit('requestUpdate', populatedRequest);
            io.emit('analyticsUpdate', { type: 'pickupCreated', isRescheduled: true });
        }

        res.json({ complaint, newPickup });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus, rescheduleComplaint };
