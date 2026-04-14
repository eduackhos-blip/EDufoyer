import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  image: {
    type: String // Path to uploaded image
  },
  doubter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doubter is required']
  },
  solver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'resolved', 'closed', 'needs_info'],
    default: 'open'
  },
  is_solved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  category: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  is_scheduled: {
    type: Boolean,
    default: false
  },
  scheduled_date: {
    type: Date
  },
  scheduled_time: {
    type: String // Store as string like "14:30"
  }
}, {
  timestamps: true
});

// Indexes for better query performance
doubtSchema.index({ subject: 1, status: 1 });
doubtSchema.index({ doubter_id: 1, createdAt: -1 });
doubtSchema.index({ status: 1, createdAt: -1 }); // For finding open doubts
doubtSchema.index({ solver_id: 1, status: 1 }); // For solver's assigned doubts
doubtSchema.index({ subject: 1, status: 1, createdAt: -1 }); // Compound index for subject-based queries
doubtSchema.index({ solver_id: 1, status: 1 });

export default mongoose.model('Doubt', doubtSchema);
