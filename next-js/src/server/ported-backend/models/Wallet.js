import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  total_earned: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [{
    doubt_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt'
    },
    amount: {
      type: Number,
      required: true
    },
    doubt_type: {
      type: String,
      enum: ['small', 'medium', 'large']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    average_rating: {
      type: Number,
      min: 0,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
WalletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
WalletSchema.index({ user_id: 1 });

const Wallet = mongoose.model('Wallet', WalletSchema);

export default Wallet;











