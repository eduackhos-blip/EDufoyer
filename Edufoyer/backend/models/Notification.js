import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doubt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doubt'
  },
  message_type: {
    type: String,
    enum: [
      'ASSIGNED_TO_SOLVER',
      'SOLUTION_SUBMITTED',
      'SOLUTION_ACCEPTED',
      'REVISION_REQUESTED',
      'REJECTED_BY_STUDENT',
      'RELEASED_BY_SOLVER',
      'DOUBT_CLOSED',
      'DOUBT_SUBMITTED',
      'DOUBT_REJECTED',
      'DOUBT_ASSIGNED',
      'DOUBT_AVAILABLE',
      'DOUBT_RESOLVED'
    ],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  is_read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
