const express = require('express');
const router = express.Router();
const { authUser, registerUser, updateUserProfile, getProfile, verifyWorker } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/register', upload.single('dlPhoto'), registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/verify-worker/:id', protect, admin, verifyWorker);

module.exports = router;
