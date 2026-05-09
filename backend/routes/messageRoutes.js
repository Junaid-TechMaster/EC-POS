import express from 'express';
import {
  getOrCreateConversation,
  getAllConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/conversations')
  .post(protect, getOrCreateConversation)
  .get(protect, admin, getAllConversations);

router
  .route('/conversations/:id')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.route('/:id').delete(protect, deleteMessage);

export default router;
