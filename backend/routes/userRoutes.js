import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  topUpWallet,
  deductWallet,
  addBonusPoints,
  redeemBonusPoints,
  getFavorites,
  updateCurrency,
  updateLocation,
  updateProfilePicture,
  getMerchantBankAccounts,
  addMerchantBankAccount,
  deleteMerchantBankAccount,
  getSavedAddress,
  updateSavedAddress,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  createStaff,
  setFirstPassword,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.route('/').post(authLimiter, registerUser).get(protect, admin, getUsers);

router.post('/login', authLimiter, authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile/picture', protect, updateProfilePicture);
router.get('/favorites', protect, getFavorites);
router.post('/wallet/topup', protect, topUpWallet);
router.post('/wallet/deduct', protect, deductWallet);
router.post('/bonus', protect, addBonusPoints);
router.post('/bonus/redeem', protect, redeemBonusPoints);
router.put('/currency', protect, updateCurrency);
router.put('/location', protect, updateLocation);

// Merchant bank accounts (admin's payment details shown to users)
router.get('/merchant/banks', protect, getMerchantBankAccounts);
router.post('/merchant/banks', protect, admin, addMerchantBankAccount);
router.delete('/merchant/banks/:idx', protect, admin, deleteMerchantBankAccount);

router.route('/address').get(protect, getSavedAddress).put(protect, updateSavedAddress);

// OTP / email verification routes (public)
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Staff management
router.post('/staff', protect, admin, createStaff);
router.post('/set-password', protect, setFirstPassword);

router.route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

export default router;
