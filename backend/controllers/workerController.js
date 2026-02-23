const PickupRequest = require('../models/PickupRequest');
const User = require('../models/User');

// Get worker's assigned tasks
exports.getMyTasks = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { assignedWorker: req.user._id };

        if (status) {
            filter.status = status;
        }

        const tasks = await PickupRequest.find(filter)
            .populate('user', 'name phone')
            .populate('area', 'name city zone location')
            .sort({ assignedAt: -1, createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get worker's work history
exports.getWorkHistory = async (req, res) => {
    try {
        const history = await PickupRequest.find({
            assignedWorker: req.user._id,
            status: 'Completed'
        })
            .populate('user', 'name')
            .populate('area', 'name city zone')
            .sort({ completedAt: -1 })
            .limit(50);

        const stats = {
            totalCompleted: history.length,
            thisWeek: history.filter(h => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return h.completedAt >= weekAgo;
            }).length,
            thisMonth: history.filter(h => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return h.completedAt >= monthAgo;
            }).length
        };

        res.json({ history, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update worker availability
exports.updateAvailability = async (req, res) => {
    try {
        const { availabilityStatus } = req.body;

        const worker = await User.findByIdAndUpdate(
            req.user._id,
            { availabilityStatus },
            { new: true }
        ).select('-password');

        const io = req.app.get('socketio');
        if (io) {
            io.to('admin').emit('driverAvailabilityChanged', {
                driverId: req.user._id,
                availabilityStatus
            });
        }

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get available workers for an area (Admin)
exports.getAvailableWorkers = async (req, res) => {
    try {
        const { areaId } = req.params;

        const workers = await User.find({
            role: 'worker',
            assignedArea: areaId,
            availabilityStatus: 'online',
            isVerified: true // Only show verified workers
        }).select('name email phone availabilityStatus');

        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all workers (Admin)
exports.getAllWorkers = async (req, res) => {
    try {
        const { availabilityStatus } = req.query;
        const matchQuery = { role: 'worker' };

        if (availabilityStatus) {
            matchQuery.availabilityStatus = availabilityStatus;
        }

        const workers = await User.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'pickuprequests',
                    localField: '_id',
                    foreignField: 'assignedWorker',
                    as: 'pickups'
                }
            },
            {
                $addFields: {
                    totalRatings: {
                        $size: {
                            $filter: {
                                input: '$pickups',
                                as: 'p',
                                cond: { $ne: ['$$p.rating', null] }
                            }
                        }
                    },
                    averageRating: {
                        $avg: {
                            $filter: {
                                input: '$pickups',
                                as: 'p',
                                cond: { $ne: ['$$p.rating', null] }
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'areas',
                    localField: 'assignedArea',
                    foreignField: '_id',
                    as: 'assignedArea'
                }
            },
            { $unwind: { path: '$assignedArea', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    password: 0,
                    pickups: 0
                }
            }
        ]);

        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign worker to area (Admin)
exports.assignWorkerToArea = async (req, res) => {
    try {
        const { workerId, areaId } = req.body;

        const worker = await User.findByIdAndUpdate(
            workerId,
            { assignedArea: areaId },
            { new: true }
        ).populate('assignedArea', 'name city zone').select('-password');

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get simple list of workers for verification (Admin)
exports.getVerificationCandidates = async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
