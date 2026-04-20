"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
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
        maxlength: [1200000, "Avatar data is too large"],
    },
    coverImageUrl: {
        type: String,
        default: null,
        maxlength: [1200000, "Cover image data is too large"],
    },
    bio: {
        type: String,
        default: null,
        trim: true,
        maxlength: [280, "Bio cannot exceed 280 characters"],
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    const plain = this.get("password");
    const salt = await bcryptjs_1.default.genSalt(12);
    this.set("password", await bcryptjs_1.default.hash(plain, salt));
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    const hash = this.get("password");
    return bcryptjs_1.default.compare(candidatePassword, hash);
};
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.User = User;
exports.default = User;
