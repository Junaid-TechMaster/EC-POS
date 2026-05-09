import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'file', 'voice'], required: true },
  name: { type: String, default: '' },
  size: { type: Number, default: 0 },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'admin', 'staff'], default: 'user' },
  text: { type: String, default: '' },
  attachments: [attachmentSchema],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
