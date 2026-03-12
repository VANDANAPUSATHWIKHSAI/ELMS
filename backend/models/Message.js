const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderRole: { type: String, default: 'Employee' }, // role of the sender
  recipientRole: { type: String, enum: ['Admin', 'Principal', 'HoD'], default: null }, // for employee→admin messages
  recipientId: { type: String, default: null }, // for admin→employee direct messages
  recipientDepartment: { type: String, default: null },
  recipientTeachingYear: { type: String, default: null },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Unread', 'Read'], default: 'Unread' },
  reply: { type: String, default: null },
  replyStatus: { type: String, enum: ['Unread', 'Read'], default: 'Unread' },
  repliedAt: { type: Date, default: null },
  repliedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

