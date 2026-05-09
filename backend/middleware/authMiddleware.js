// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// 1. Protect routes (Must be logged in to access)
export const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.jwt; // Read the cookie we set during login

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      next(); // All good, move to the next step
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// 2. Admin routes (Must be an admin to access)
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

// 3. Staff routes (admin or staff role)
export const staff = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as staff');
  }
};

// 4. Optional protect — sets req.user if valid token exists, otherwise sets req.user = null and continues
export const optionalProtect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (_) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});