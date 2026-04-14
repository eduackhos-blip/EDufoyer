import mongoose from 'mongoose';

const doubtPackPurchaseSchema = new mongoose.Schema({
  university_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional to handle cases where user doesn't exist
    default: null
  },
  university_name: {
    type: String,
    required: true,
    trim: true
  },
  university_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  doubt_pack_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoubtPack',
    required: true
  },
  doubt_pack_details: {
    totalDoubts: {
      type: Number,
      required: true
    },
    categories: [{
      name: String,
      count: Number
    }]
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  razorpay_order_id: {
    type: String,
    required: false
  },
  razorpay_payment_id: {
    type: String,
    required: false
  },
  purchase_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
doubtPackPurchaseSchema.index({ university_id: 1 }, { sparse: true }); // Sparse index allows null values
doubtPackPurchaseSchema.index({ purchase_date: -1 });
doubtPackPurchaseSchema.index({ payment_status: 1 });

const DoubtPackPurchase = mongoose.model('DoubtPackPurchase', doubtPackPurchaseSchema);

export default DoubtPackPurchase;

