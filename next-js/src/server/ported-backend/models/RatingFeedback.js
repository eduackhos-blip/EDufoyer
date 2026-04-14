import mongoose from 'mongoose';

const ratingFeedbackSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  user_email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  is_approved: {
    type: Boolean,
    default: false // Admin needs to approve before showing publicly
  },
  is_featured: {
    type: Boolean,
    default: false // Featured reviews shown prominently
  }
}, {
  timestamps: true
});

// Indexes
ratingFeedbackSchema.index({ rating: -1 });
ratingFeedbackSchema.index({ createdAt: -1 });
ratingFeedbackSchema.index({ is_approved: 1 });
ratingFeedbackSchema.index({ is_featured: 1 });

const RatingFeedback = mongoose.model('RatingFeedback', ratingFeedbackSchema);

export default RatingFeedback;















