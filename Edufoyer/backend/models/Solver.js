import mongoose from 'mongoose';

const SolverSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialities: [{
    type: String,
    required: true
  }],
  experience: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  total_doubts_solved: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
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
SolverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
SolverSchema.index({ specialities: 1 }); // For finding solvers by subject
SolverSchema.index({ user_id: 1 }); // For finding solver by user
SolverSchema.index({ isActive: 1, specialities: 1 }); // For active solvers by subject
SolverSchema.index({ rating: -1, total_doubts_solved: -1 }); // For ranking solvers

const Solver = mongoose.model('Solver', SolverSchema);

export default Solver;
