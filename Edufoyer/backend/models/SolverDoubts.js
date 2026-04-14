import mongoose from 'mongoose';

const SolverDoubtsSchema = new mongoose.Schema({
  doubt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doubt',
    required: true
  },
  solver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date
  },
  resolution_status: {
    type: String,
    enum: ['pending', 'session_scheduled', 'session_completed', 'accepted', 'rejected', 'needs_revision'],
    default: 'pending'
  },
  livekit_room_name: {
    type: String
  },
  feedback_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback_comment: {
    type: String,
    maxlength: 1000
  },
  solver_rating_of_asker: {
    type: Number,
    min: 1,
    max: 5
  },
  solver_comment_of_asker: {
    type: String,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
SolverDoubtsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SolverDoubts = mongoose.model('SolverDoubts', SolverDoubtsSchema);

export default SolverDoubts;
