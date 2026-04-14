import mongoose from 'mongoose';

const doubtPackSchema = new mongoose.Schema({
  totalDoubts: {
    type: Number,
    required: true,
    min: 1
  },
  categories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, in case admin is not a user
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
doubtPackSchema.index({ createdAt: -1 });
doubtPackSchema.index({ isActive: 1 });

const DoubtPack = mongoose.model('DoubtPack', doubtPackSchema);

export default DoubtPack;


















