// backend/routes/userRoutes.js
import express from 'express';
import { authUser, registerUser, logoutUser, getUsers } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// The root route handles both Registration (POST) and Admin Fetching Users (GET)
router.route('/')
  .post(registerUser)
  .get(protect, admin, getUsers); // Must be logged in AND an admin to get this data!

router.post('/login', authUser);
router.post('/logout', logoutUser);

export default router;