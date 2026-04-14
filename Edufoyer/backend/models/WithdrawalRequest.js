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

// Update the updatedAt field before saving
WithdrawalRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
WithdrawalRequestSchema.index({ user_id: 1 });
WithdrawalRequestSchema.index({ status: 1 });
WithdrawalRequestSchema.index({ createdAt: -1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);

export default WithdrawalRequest;












