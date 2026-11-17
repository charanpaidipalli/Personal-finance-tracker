const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true },
  limit: { type: Number, required: true, min: 0 },
  month: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Budget', schema);
