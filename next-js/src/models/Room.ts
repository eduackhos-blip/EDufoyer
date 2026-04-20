import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    doubt_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      required: true,
    },
    solver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doubter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

RoomSchema.index({ doubt_id: 1, solver_id: 1 }, { unique: true });
RoomSchema.index({ solver_id: 1, status: 1 });
RoomSchema.index({ doubter_id: 1, status: 1 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
