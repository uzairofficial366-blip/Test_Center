const express = require('express');
const router = express.Router();
const { getDashboardData, getTestDetails, startTest, submitTest } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/test/:testId', getTestDetails);
router.post('/test/:testId/start', startTest);
router.post('/test/:testId/submit', submitTest);

module.exports = router;
