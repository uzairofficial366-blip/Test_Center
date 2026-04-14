const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);

module.exports = router;
