const express = require('express');
const router = express.Router();
const { createTest, addQuestion, assignTest, getTests, getUsers, uploadTestFiles, getResults } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect, admin); // Apply to all admin routes

router.post('/test', createTest);
router.post('/upload-test', upload.fields([{ name: 'testFile', maxCount: 1 }, { name: 'resultFile', maxCount: 1 }]), uploadTestFiles);
router.post('/question', addQuestion);
router.post('/assign', assignTest);
router.get('/tests', getTests);
router.get('/users', getUsers);
router.get('/results', getResults);

module.exports = router;
