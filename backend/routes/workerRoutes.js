const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMyTasks,
    getWorkHistory,
    updateAvailability,
    getAvailableWorkers,
    getAllWorkers,
    assignWorkerToArea,
    getVerificationCandidates
} = require('../controllers/workerController');

// Worker routes
router.get('/my-tasks', protect, getMyTasks);
router.get('/work-history', protect, getWorkHistory);
router.put('/availability', protect, updateAvailability);

// Admin routes
router.get('/', protect, admin, getAllWorkers);
router.get('/available/:areaId', protect, admin, getAvailableWorkers);
router.get('/verification-candidates', protect, admin, getVerificationCandidates);
router.put('/assign-area', protect, admin, assignWorkerToArea);

module.exports = router;
