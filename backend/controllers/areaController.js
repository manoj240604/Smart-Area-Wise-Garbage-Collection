const Area = require('../models/Area');
const Bin = require('../models/Bin');
const User = require('../models/User');

// @desc    Get all areas
// @route   GET /api/areas
// @access  Protected
const getAreas = async (req, res) => {
    try {
        const areas = await Area.find({});
        res.json(areas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new area
// @route   POST /api/areas
// @access  Admin
const createArea = async (req, res) => {
    const { name, zone, latitude, longitude, priorityLevel } = req.body;

    try {
        const area = new Area({
            name,
            zone,
            location: {
                coordinates: [longitude, latitude]
            },
            priorityLevel
        });

        const createdArea = await area.save();
        res.status(201).json(createdArea);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const assignWorkersToArea = async (req, res) => {
    const { areaId } = req.params;
    const { workerIds } = req.body; // Array of worker IDs

    try {
        const area = await Area.findById(areaId);
        if (area) {
            area.assignedWorkers = workerIds;
            const updatedArea = await area.save();

            // Also update each worker's assignedArea field
            await User.updateMany(
                { _id: { $in: workerIds } },
                { $set: { assignedArea: areaId } }
            );

            res.json(updatedArea);
        } else {
            res.status(404).json({ message: 'Area not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an area
// @route   PUT /api/areas/:id
// @access  Admin
const updateArea = async (req, res) => {
    const { name, zone, latitude, longitude, priorityLevel } = req.body;

    try {
        const area = await Area.findById(req.params.id);

        if (area) {
            area.name = name || area.name;
            area.zone = zone || area.zone;
            if (latitude !== undefined && longitude !== undefined) {
                area.location = {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                };
            }
            area.priorityLevel = priorityLevel || area.priorityLevel;

            const updatedArea = await area.save();
            res.json(updatedArea);
        } else {
            res.status(404).json({ message: 'Area not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an area
// @route   DELETE /api/areas/:id
// @access  Admin
const deleteArea = async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);

        if (area) {
            // Optional: Check for dependencies (bins, workers) before deleting
            // For now, simple delete
            await Area.deleteOne({ _id: req.params.id });
            res.json({ message: 'Area removed' });
        } else {
            res.status(404).json({ message: 'Area not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bins by area
// @route   GET /api/areas/:areaId/bins
// @access  Protected
const getBinsByArea = async (req, res) => {
    try {
        const bins = await Bin.find({ areaId: req.params.areaId }).populate('areaId', 'name');
        res.json(bins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a bin
// @route   POST /api/bins
// @access  Admin
const createBin = async (req, res) => {
    const { binId, areaId } = req.body;

    try {
        const bin = new Bin({
            binId,
            areaId
        });

        const createdBin = await bin.save();
        res.status(201).json(createdBin);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update bin garbage level (Simulate IoT or manual)
// @route   PUT /api/bins/:id/level
// @access  Protected
const updateBinLevel = async (req, res) => {
    const { garbageLevel } = req.body;

    try {
        const bin = await Bin.findById(req.params.id);

        if (bin) {
            bin.garbageLevel = garbageLevel;
            bin.lastCollectedAt = garbageLevel === 0 ? Date.now() : bin.lastCollectedAt;

            const updatedBin = await bin.save();

            // Emit socket event
            const io = req.app.get('socketio');
            io.emit('binUpdate', updatedBin);

            if (updatedBin.status === 'Full' || updatedBin.status === 'Overflowing') {
                io.emit('binAlert', { message: `Bin ${updatedBin.binId} is ${updatedBin.status}!`, bin: updatedBin });
            }

            res.json(updatedBin);
        } else {
            res.status(404).json({ message: 'Bin not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Collect garbage (Reset level)
// @route   PUT /api/bins/:id/collect
// @access  Collector/Admin
const collectBin = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id);

        if (bin) {
            bin.garbageLevel = 0;
            bin.lastCollectedAt = Date.now();
            bin.status = 'Normal';

            const updatedBin = await bin.save();

            const io = req.app.get('socketio');
            io.emit('binUpdate', updatedBin);

            res.json(updatedBin);
        } else {
            res.status(404).json({ message: 'Bin not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getAreas,
    createArea,
    updateArea,
    deleteArea,
    getBinsByArea,
    createBin,
    updateBinLevel,
    collectBin,
    assignWorkersToArea
};
