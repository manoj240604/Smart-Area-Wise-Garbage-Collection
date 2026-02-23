const express = require('express');
const router = express.Router();
const { reportProblem, getAllProblems, schedulePickupForProblem } = require('../controllers/problemController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.route('/')
    .post(protect, upload.single('photo'), reportProblem)
    .get(protect, admin, getAllProblems);

router.route('/:id/schedule')
    .post(protect, admin, schedulePickupForProblem);

module.exports = router;
