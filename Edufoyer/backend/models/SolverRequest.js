import mongoose from 'mongoose';

const solverRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  subjects: [{
    type: String,
    required: true,
    trim: true
  }],
  resume: {
    type: String,
    required: true
  },
  marksheet: {
    type: String,
    required: true
  },
  aadhar: {
    type: String,
    required: true
  },
  pancard: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admin_notes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
solverRequestSchema.index({ user_id: 1 });
solverRequestSchema.index({ status: 1 });
solverRequestSchema.index({ createdAt: -1 });

const SolverRequest = mongoose.model('SolverRequest', solverRequestSchema);

export default SolverRequest;









