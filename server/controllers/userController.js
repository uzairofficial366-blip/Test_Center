const TestAssignment = require('../models/TestAssignment');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const User = require('../models/User');

const getDashboardData = async (req, res) => {
  try {
    const assignments = await TestAssignment.find({ userId: req.user._id })
      .populate('testId');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTestDetails = async (req, res) => {
  const { testId } = req.params;
  try {
    // Check if assigned
    const assignment = await TestAssignment.findOne({ userId: req.user._id, testId });
    if (!assignment) {
      return res.status(403).json({ message: 'Test not assigned' });
    }
    
    const test = await Test.findById(testId);
    let questions = [];
    
    // Only return questions if it's past start time and before end time/submission
    const now = new Date();
    if (now >= new Date(test.startTime) && now <= new Date(test.endTime)) {
       // Return questions without correct answers
       questions = await Question.find({ testId }).select('-correctAnswer');
    }

    res.json({ test, assignment, questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const startTest = async (req, res) => {
  const { testId } = req.params;
  try {
    const assignment = await TestAssignment.findOne({ userId: req.user._id, testId, status: 'assigned' });
    if (!assignment) {
      return res.status(400).json({ message: 'Test not available to start' });
    }

    assignment.startedAt = new Date();
    await assignment.save();

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitTest = async (req, res) => {
  const { testId } = req.params;
  const { answers } = req.body; // Array of { questionId, selectedOption }

  try {
    const assignment = await TestAssignment.findOne({ userId: req.user._id, testId, status: 'assigned' });
    if (!assignment) {
      return res.status(400).json({ message: 'Test already submitted or not available' });
    }

    // Fetch submitting user to capture name & rollno
    const userDoc = await User.findById(req.user._id).select('name rollno');

    // Fetch all questions for this test to count total
    const allQuestions = await Question.find({ testId });
    const totalQuestions = allQuestions.length;

    // Calculate score
    let score = 0;
    for (let ans of answers) {
      const q = allQuestions.find(q => q._id.toString() === ans.questionId.toString());
      if (q && q.correctAnswer === ans.selectedOption) {
        score++;
      }
    }

    // Save submission with name & rollno embedded
    const submission = await Submission.create({
      userId:  req.user._id,
      testId,
      name:    userDoc?.name   || 'Unknown',
      rollno:  userDoc?.rollno != null ? String(userDoc.rollno) : '',
      answers,
      score,
      totalQuestions
    });

    assignment.status = 'completed';
    assignment.submittedAt = new Date();
    await assignment.save();

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData, getTestDetails, startTest, submitTest };
