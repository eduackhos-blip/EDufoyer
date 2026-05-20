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
    enum: [
      'pending',
      'session_scheduled',
      'session_completed',
      'ended_solver_left',
      'ended_asker_timeout',
      'ended_asker_rated',
      'ended_solver_abandoned_grace',
      'accepted',
      'rejected',
      'needs_revision',
    ],
    default: 'pending'
  },
  room_id: {
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

// Mongoose 7+/8-safe hook style (no legacy `next` callback).
SolverDoubtsSchema.pre('save', function() {
  this.set('updatedAt', new Date());
});

export default mongoose.models.SolverDoubts || mongoose.model('SolverDoubts', SolverDoubtsSchema);

