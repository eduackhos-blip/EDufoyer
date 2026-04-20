import mongoose from 'mongoose';

const WithdrawalRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  upi_id: {
    type: String,
    trim: true
  },
  bank_account_number: {
    type: String,
    trim: true
  },
  bank_ifsc: {
    type: String,
    trim: true,
    uppercase: true
  },
  bank_name: {
    type: String,
    trim: true
  },
  account_holder_name: {
    type: String,
    trim: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'disbursed'],
    default: 'pending'
  },
  admin_notes: {
    type: String,
    trim: true
  },
  disbursed_at: {
    type: Date
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
WithdrawalRequestSchema.pre('save', function() {
  this.set('updatedAt', new Date());
});

// Indexes
WithdrawalRequestSchema.index({ user_id: 1 });
WithdrawalRequestSchema.index({ status: 1 });
WithdrawalRequestSchema.index({ createdAt: -1 });

export default mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

