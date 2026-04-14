import mongoose from 'mongoose';

const universityDoubtBalanceSchema = new mongoose.Schema({
  university_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  university_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true // One balance per university email
  },
  university_name: {
    type: String,
    required: true,
    trim: true
  },
  doubtBuckets: {
    small: {
      type: Number,
      default: 0,
      min: 0
    },
    medium: {
      type: Number,
      default: 0,
      min: 0
    },
    large: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalAvailable: {
    type: Number,
      default: 0,
      min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
universityDoubtBalanceSchema.index({ university_email: 1 });
universityDoubtBalanceSchema.index({ university_id: 1 }, { sparse: true });

// Virtual to calculate total available doubts
universityDoubtBalanceSchema.virtual('calculatedTotal').get(function() {
  return (this.doubtBuckets.small || 0) + (this.doubtBuckets.medium || 0) + (this.doubtBuckets.large || 0);
});

// Update totalAvailable before saving
universityDoubtBalanceSchema.pre('save', function(next) {
  this.totalAvailable = this.calculatedTotal;
  this.lastUpdated = new Date();
  next();
});

const UniversityDoubtBalance = mongoose.model('UniversityDoubtBalance', universityDoubtBalanceSchema);

export default UniversityDoubtBalance;














