import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isSolver: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpiry: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      trim: true,
      maxlength: [280, "Bio cannot exceed 280 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose 7+: async middleware should not use `next`; mixing async + next breaks typings.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const plain = this.get("password") as string;
  const salt = await bcrypt.genSalt(12);
  this.set("password", await bcrypt.hash(plain, salt));
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const hash = this.get("password") as string;
  return bcrypt.compare(candidatePassword, hash);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject() as Record<string, unknown> & { password?: string };
  delete userObject.password;
  return userObject;
};

export default mongoose.models.User || mongoose.model("User", userSchema);
