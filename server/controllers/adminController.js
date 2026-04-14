const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAssignment = require('../models/TestAssignment');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { parseTestUploads } = require('../utils/testParser');

const uploadTestFiles = async (req, res) => {
  const { title, category, duration, startTime, endTime, deadline } = req.body;
  const testFile = req.files && req.files.testFile ? req.files.testFile[0] : null;
  const resultFile = req.files && req.files.resultFile ? req.files.resultFile[0] : null;

  if (!testFile) {
    return res.status(400).json({ message: 'Test file is required' });
  }

  try {
    const questions = await parseTestUploads(testFile, resultFile);
    
    if (questions.length === 0) {
      return res.status(400).json({ message: 'Could not parse any valid questions from the files provided.' });
    }

    const test = await Test.create({
      title,
      category,
      duration,
      startTime,
      endTime,
      deadline,
      createdBy: req.user._id
    });

    const parsedQuestions = questions.map(q => ({
      testId: test._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));

    await Question.insertMany(parsedQuestions);

    res.status(201).json({ message: 'Test uploaded successfully', test, parsedCount: questions.length });
  } catch (error) {
    res.status(500).json({ message: 'Error parsing files', error: error.message });
  }
};

const createTest = async (req, res) => {
  const { title, category, duration, startTime, endTime, deadline } = req.body;
  try {
    const test = await Test.create({
      title,
      category,
      duration,
      startTime,
      endTime,
      deadline,
      createdBy: req.user._id
    });
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addQuestion = async (req, res) => {
  const { testId, questionText, options, correctAnswer } = req.body;
  try {
    const question = await Question.create({
      testId,
      questionText,
      options,
      correctAnswer
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const assignTest = async (req, res) => {
  const { userId, testId } = req.body;
  try {
    const assignment = await TestAssignment.create({
      userId,
      testId
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTests = async (req, res) => {
  const tests = await Test.find({});
  res.json(tests);
};

const getUsers = async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password');
  res.json(users);
};

const getResults = async (req, res) => {
  try {
    const submissions = await Submission.find({})
      .populate('testId', 'title category')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTest, addQuestion, assignTest, getTests, getUsers, uploadTestFiles, getResults };
