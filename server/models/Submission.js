const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  // Student identity – stored directly so results are self-contained
  name:    { type: String, required: true },
  rollno:  { type: String, default: '' },
  answers: [{
    questionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, required: true }
  }],
  score:        { type: Number, required: true, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  submittedAt:  { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
