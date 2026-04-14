const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Test = require('./models/Test');
const Question = require('./models/Question');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edutest';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for seeding');

    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@edutest.com' });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@edutest.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created: admin@edutest.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Check if dummy test exists
    let test = await Test.findOne({ title: 'Biology Mock Test' });
    if (!test) {
      const now = new Date();
      const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      test = await Test.create({
        title: 'Biology Mock Test',
        category: 'Pre-Medical',
        duration: 30, // 30 minutes
        startTime: now,
        endTime: endTime,
        deadline: endTime,
        createdBy: admin._id
      });
      
      await Question.create({
        testId: test._id,
        questionText: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cytoplasm'],
        correctAnswer: 'Mitochondria' // Matches option B
      });
      console.log('Dummy test "Biology Mock Test" created');
    } else {
      console.log('Dummy test already exists');
    }

    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
