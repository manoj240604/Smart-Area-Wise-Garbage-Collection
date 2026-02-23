const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    createPickupRequest,
    getUserRequests,
    getAllRequests,
    assignWorker,
    updateStatus,
    getRequestById,
    getStatistics,
    rateRequest
} = require('../controllers/pickupRequestController');

// Citizen routes
router.post('/', protect, upload.single('image'), createPickupRequest);
router.get('/my-requests', protect, getUserRequests);
router.get('/:id', protect, getRequestById);
router.post('/:requestId/rate', protect, rateRequest);

// Admin routes
router.get('/', protect, admin, getAllRequests);
router.put('/:requestId/assign', protect, admin, assignWorker);
router.get('/stats/dashboard', protect, admin, getStatistics);

// Worker routes
router.put('/:requestId/status', protect, updateStatus);

module.exports = router;
