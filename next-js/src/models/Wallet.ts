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

// Mongoose 7+ hook style (no `next` callback with async/sync middleware signature issues)
WalletSchema.pre("save", function () {
  this.set("updatedAt", new Date());
});

// Indexes
WalletSchema.index({ user_id: 1 });

export default mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

