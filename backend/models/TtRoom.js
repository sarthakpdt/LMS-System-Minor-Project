const mongoose = require('mongoose');

const ttRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Room 101"
  type: { type: String, enum: ['classroom', 'lab'], required: true },
  capacity: { type: Number, required: true },
  labType: { type: String, default: '' }, // e.g. "Computer", "Electronics", "Design", or empty
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TtRoom', ttRoomSchema);
