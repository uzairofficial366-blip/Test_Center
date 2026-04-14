const mongoose = require('mongoose');

const testAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  status: { type: String, enum: ['assigned', 'completed'], default: 'assigned' },
  startedAt: { type: Date },
  submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TestAssignment', testAssignmentSchema);
