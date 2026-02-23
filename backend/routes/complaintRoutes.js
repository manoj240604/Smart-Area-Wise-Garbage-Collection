const express = require('express');
const router = express.Router();
const { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus, rescheduleComplaint } = require('../controllers/complaintController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.route('/').post(protect, upload.single('image'), createComplaint).get(protect, admin, getAllComplaints);
router.route('/my').get(protect, getMyComplaints);
router.route('/:id').put(protect, admin, updateComplaintStatus);
router.route('/:id/reschedule').put(protect, admin, rescheduleComplaint);

module.exports = router;
