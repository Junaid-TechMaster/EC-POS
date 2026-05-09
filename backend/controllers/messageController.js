import asyncHandler from 'express-async-handler';
import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';

// @desc    Get or create a conversation for the logged-in user
// @route   POST /api/messages/conversations
// @access  Private (user)
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  let conversation = await Conversation.findOne({ user: req.user._id });
  if (!conversation) {
    conversation = await Conversation.create({ user: req.user._id });
  }
  res.json(conversation);
});

// @desc    Get all conversations (admin)
// @route   GET /api/messages/conversations
// @access  Private/Admin
export const getAllConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({})
    .populate('user', 'name email profilePicture role')
    .sort({ lastMessageAt: -1 });
  res.json(conversations);
});

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Access control: admin can read any, user can only read their own
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    if (conversation.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this conversation');
    }
  }

  // Mark unread as read
  if (req.user.role === 'admin' || req.user.role === 'staff') {
    if (conversation.adminUnread > 0) {
      conversation.adminUnread = 0;
      await conversation.save();
    }
  } else {
    if (conversation.userUnread > 0) {
      conversation.userUnread = 0;
      await conversation.save();
    }
  }

  const messages = await Message.find({ conversation: req.params.id })
    .populate('sender', 'name profilePicture role')
    .sort({ createdAt: 1 });

  res.json(messages);
});

// @desc    Send a message in a conversation
// @route   POST /api/messages/conversations/:id
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { text, attachments } = req.body;
  const hasText = text && text.trim();
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasText && !hasAttachments) {
    res.status(400);
    throw new Error('Message must have text or attachments');
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Access control: admin can send in any, user can only send in their own
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    if (conversation.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to send in this conversation');
    }
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    senderRole: req.user.role,
    text: hasText ? text.trim() : '',
    attachments: hasAttachments ? attachments : [],
  });

  // Build conversation preview
  let preview = hasText ? text.trim() : '';
  if (!preview && hasAttachments) {
    const first = attachments[0];
    preview = first.type === 'voice' ? '🎤 Voice message' : first.type === 'image' ? '📷 Photo' : `📎 ${first.name || 'File'}`;
  }
  conversation.lastMessage = preview;
  conversation.lastMessageAt = new Date();

  if (req.user.role === 'admin' || req.user.role === 'staff') {
    conversation.userUnread += 1;
  } else {
    conversation.adminUnread += 1;
  }

  await conversation.save();

  const populated = await message.populate('sender', 'name profilePicture role');
  res.status(201).json(populated);
});

// @desc    Delete (soft-delete) a message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Only sender or admin can delete
  if (
    message.sender.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }

  message.isDeleted = true;
  message.text = 'This message was deleted';
  await message.save();

  res.json({ message: 'Message deleted', _id: message._id, isDeleted: true, text: message.text });
});
