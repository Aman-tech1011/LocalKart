const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    codeHash: {
      type: Buffer,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    sendWindowStartedAt: {
      type: Date,
      required: true,
    },
    sendCount: {
      type: Number,
      default: 1,
    },
    resetTokenHash: {
      type: Buffer,
    },
    resetTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
