import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendEmail } from '../utils/sendEmail.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHTML = (otp, heading, message) => `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
    <h2 style="color:#16a34a;text-align:center;">${heading}</h2>
    <p style="color:#374151;text-align:center;">${message}</p>
    <div style="text-align:center;margin:32px 0;">
      <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#111827;background:#fff;padding:16px 32px;border-radius:8px;display:inline-block;border:2px solid #e5e7eb;">${otp}</span>
    </div>
    <p style="color:#6b7280;text-align:center;font-size:13px;">This OTP expires in <strong>2 minutes</strong>. Do not share it with anyone.</p>
    <p style="color:#9ca3af;text-align:center;font-size:12px;">If you didn't request this, please ignore this email.</p>
  </div>
`;

// @desc    Auth user & get token (LOGIN)
// @route   POST /api/users/login
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.isVerified === false) {
      res.status(403);
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    generateToken(res, user._id);
    logActivity({ userId: user._id, userName: user.name, action: 'LOGIN', entity: 'user', entityId: user._id.toString(), ip: req.ip });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance,
      bonusPoints: user.bonusPoints,
      preferredCurrency: user.preferredCurrency,
      country: user.country,
      countryCode: user.countryCode,
      profilePicture: user.profilePicture || '',
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user (SIGNUP)
// @route   POST /api/users
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  const user = await User.create({ name, email, password, isVerified: false, otp, otpExpiry });

  if (user) {
    await sendEmail({
      to: email,
      subject: 'Verify Your Account — EC-POS',
      html: otpEmailHTML(otp, 'Email Verification OTP', 'Use the OTP below to verify your email address and activate your account.'),
    });
    res.status(201).json({ pendingVerification: true, email, message: 'OTP sent to your email. Please verify to continue.' });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('name');
      if (user) logActivity({ userId: user._id, userName: user.name, action: 'LOGOUT', entity: 'user', entityId: user._id.toString(), ip: req.ip });
    } catch (_) {}
  }
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('favorites', 'name image price oldPrice rating numReviews countInStock');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Top up user wallet
// @route   POST /api/users/wallet/topup
// @access  Private
export const topUpWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid top-up amount');
  }

  const user = await User.findById(req.user._id);
  user.walletBalance += Number(amount);
  await user.save();

  res.json({ walletBalance: user.walletBalance, message: `Wallet topped up by ${amount}` });
});

// @desc    Deduct from wallet (used during checkout)
// @route   POST /api/users/wallet/deduct
// @access  Private
export const deductWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user._id);

  if (user.walletBalance < amount) {
    res.status(400);
    throw new Error('Insufficient wallet balance');
  }

  user.walletBalance -= Number(amount);
  await user.save();

  res.json({ walletBalance: user.walletBalance });
});

// @desc    Add bonus points (called after successful purchase)
// @route   POST /api/users/bonus
// @access  Private
export const addBonusPoints = asyncHandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user._id);
  user.bonusPoints += Number(points);
  await user.save();
  res.json({ bonusPoints: user.bonusPoints });
});

// @desc    Redeem bonus points to wallet (10 points = 10 PKR)
// @route   POST /api/users/bonus/redeem
// @access  Private
export const redeemBonusPoints = asyncHandler(async (req, res) => {
  const { points } = req.body;
  const user = await User.findById(req.user._id);

  if (user.bonusPoints < points) {
    res.status(400);
    throw new Error('Insufficient bonus points');
  }

  const value = Number(points); // 1 point = 1 PKR
  user.bonusPoints -= Number(points);
  user.walletBalance += value;
  await user.save();

  res.json({ walletBalance: user.walletBalance, bonusPoints: user.bonusPoints });
});

// @desc    Get user favorites list
// @route   GET /api/users/favorites
// @access  Private
export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'favorites',
    'name image price oldPrice rating numReviews countInStock unitsSold savedByCount'
  );
  res.json(user.favorites);
});

// @desc    Update preferred currency
// @route   PUT /api/users/currency
// @access  Private
export const updateCurrency = asyncHandler(async (req, res) => {
  const { currency } = req.body;
  const user = await User.findById(req.user._id);
  user.preferredCurrency = currency;
  await user.save();
  res.json({ preferredCurrency: user.preferredCurrency });
});

// @desc    Update location
// @route   PUT /api/users/location
// @access  Private
export const updateLocation = asyncHandler(async (req, res) => {
  const { country, countryCode } = req.body;
  const user = await User.findById(req.user._id);
  user.country = country;
  user.countryCode = countryCode;
  await user.save();
  res.json({ country: user.country, countryCode: user.countryCode });
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const filter = { isDeleted: { $ne: true } };
  if (req.query.roles) {
    filter.role = { $in: req.query.roles.split(',') };
  }
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(400); throw new Error('Cannot delete an admin user'); }
  await User.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  res.json({ message: 'User removed successfully' });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.savedAddress && typeof req.body.savedAddress === 'object') {
      user.savedAddress = { ...(user.savedAddress?.toObject?.() || {}), ...req.body.savedAddress };
    }
    if (Array.isArray(req.body.permissions)) {
      user.permissions = req.body.permissions;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update profile picture
// @route   PUT /api/users/profile/picture
// @access  Private
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const { profilePicture } = req.body;
  const user = await User.findById(req.user._id);
  user.profilePicture = profilePicture || '';
  await user.save();
  res.json({ profilePicture: user.profilePicture });
});

// @desc    Get merchant (admin) bank accounts — for users to see payment options
// @route   GET /api/users/merchant/banks
// @access  Private
export const getMerchantBankAccounts = asyncHandler(async (req, res) => {
  const merchantUser = await User.findOne({ role: 'admin' }).select('bankAccounts name');
  res.json(merchantUser?.bankAccounts || []);
});

// @desc    Add merchant bank account (admin sets their own payment details)
// @route   POST /api/users/merchant/banks
// @access  Private/Admin
export const addMerchantBankAccount = asyncHandler(async (req, res) => {
  const { bankName, accountTitle, accountNumber, iban, isDefault } = req.body;
  const user = await User.findById(req.user._id);

  if (isDefault) {
    user.bankAccounts.forEach(acc => { acc.isDefault = false; });
  }
  user.bankAccounts.push({ bankName, accountTitle, accountNumber, iban: iban || '', isDefault: isDefault || false });
  await user.save();
  res.status(201).json(user.bankAccounts);
});

// @desc    Delete merchant bank account
// @route   DELETE /api/users/merchant/banks/:idx
// @access  Private/Admin
export const deleteMerchantBankAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx = Number(req.params.idx);
  if (idx < 0 || idx >= user.bankAccounts.length) {
    res.status(400); throw new Error('Invalid account index');
  }
  user.bankAccounts.splice(idx, 1);
  await user.save();
  res.json(user.bankAccounts);
});

// @route GET /api/users/address
export const getSavedAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.savedAddress || {});
});

// @route PUT /api/users/address
export const updateSavedAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.savedAddress = { ...user.savedAddress, ...req.body };
  await user.save();
  res.json(user.savedAddress);
});

// ==========================================
// OTP / EMAIL VERIFICATION
// ==========================================

// @desc    Verify OTP after registration
// @route   POST /api/users/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.isVerified) { res.status(400); throw new Error('Already verified'); }
  if (!user.otp || user.otp !== otp) { res.status(400); throw new Error('Invalid OTP'); }
  if (new Date() > user.otpExpiry) { res.status(400); throw new Error('OTP_EXPIRED'); }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  generateToken(res, user._id);
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    walletBalance: user.walletBalance,
    bonusPoints: user.bonusPoints,
    preferredCurrency: user.preferredCurrency,
    country: user.country,
    countryCode: user.countryCode,
    profilePicture: user.profilePicture || '',
    mustChangePassword: user.mustChangePassword || false,
  });
});

// @desc    Resend OTP (register verify or forgot password)
// @route   POST /api/users/resend-otp
export const resendOTP = asyncHandler(async (req, res) => {
  const { email, type = 'verify' } = req.body;
  const user = await User.findOne({ email });

  if (!user) { res.status(404); throw new Error('User not found'); }
  if (type === 'verify' && user.isVerified) { res.status(400); throw new Error('Already verified'); }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
  await user.save();

  const heading = type === 'forgot' ? 'Password Reset OTP' : 'Email Verification OTP';
  const message = type === 'forgot'
    ? 'Use the OTP below to reset your password.'
    : 'Use the OTP below to verify your email address.';

  await sendEmail({ to: email, subject: `${heading} — EC-POS`, html: otpEmailHTML(otp, heading, message) });
  res.json({ message: 'OTP resent successfully' });
});

// @desc    Send OTP for password reset
// @route   POST /api/users/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (user) {
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
    await user.save();
    await sendEmail({
      to: email,
      subject: 'Password Reset OTP — EC-POS',
      html: otpEmailHTML(otp, 'Password Reset OTP', 'You requested a password reset. Use the OTP below to set a new password.'),
    });
  }

  res.json({ message: 'If that email exists, an OTP has been sent.' });
});

// @desc    Admin creates a staff account (sends OTP, requires first-login password set)
// @route   POST /api/users/staff
// @access  Private/Admin
export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, permissions = [] } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('Name, email, and password are required'); }

  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already in use'); }

  const otp = generateOTP();
  const user = await User.create({
    name, email, password,
    role: 'staff',
    permissions,
    isVerified: false,
    mustChangePassword: true,
    otp,
    otpExpiry: new Date(Date.now() + 2 * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: 'Your Staff Account — EC-POS',
    html: otpEmailHTML(
      otp,
      'Welcome to EC-POS Staff!',
      `Your staff account has been created by an administrator. Use the OTP below to verify your email, then you will be prompted to set your own password.`
    ),
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    message: `Staff account created. OTP sent to ${email}.`,
  });
});

// @desc    Set password for first-time login (after OTP verification)
// @route   POST /api/users/set-password
// @access  Private (JWT set by verify-otp)
export const setFirstPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }

  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (!user.mustChangePassword) { res.status(400); throw new Error('No password change required'); }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.json({ message: 'Password set successfully', role: user.role });
});

// @desc    Reset password using OTP
// @route   POST /api/users/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.otp || user.otp !== otp) { res.status(400); throw new Error('Invalid OTP'); }
  if (new Date() > user.otpExpiry) { res.status(400); throw new Error('OTP_EXPIRED'); }
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }

  user.password = newPassword;
  user.otp = null;
  user.otpExpiry = null;
  user.isVerified = true;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
});
