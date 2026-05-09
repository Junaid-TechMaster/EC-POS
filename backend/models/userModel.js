import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'staff'], default: 'user' },

    // Wallet system
    walletBalance: { type: Number, default: 0 },

    // Loyalty / Bonus points
    bonusPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    // Saved / favourite products
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Applied voucher codes history
    usedVouchers: [{ type: String }],

    // Location (auto-detected or selected)
    country: { type: String, default: '' },
    countryCode: { type: String, default: '' }, // ISO 2-letter code e.g. PK, US

    // Preferred currency
    preferredCurrency: { type: String, default: 'USD' },

    // Profile picture URL (Cloudinary or local)
    profilePicture: { type: String, default: '' },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Bank accounts for merchants/admins
    bankAccounts: [
      {
        bankName: String,
        accountTitle: String,
        accountNumber: String,
        iban: String,
        logo: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
      },
    ],
    phone: { type: String, default: '' },

    // Staff feature permissions (used when role === 'staff')
    permissions: [{ type: String }],

    // OTP verification (email verify on register + forgot password)
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    // default: true so existing users are treated as verified without migration
    isVerified: { type: Boolean, default: true },
    // true for admin-created staff accounts — forces password change on first login
    mustChangePassword: { type: Boolean, default: false },

    savedAddress: {
      fullName:     { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city:         { type: String, default: '' },
      state:        { type: String, default: '' },
      postalCode:   { type: String, default: '' },
      country:      { type: String, default: 'Pakistan' },
      phone:        { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
