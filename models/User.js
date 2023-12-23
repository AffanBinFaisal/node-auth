const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  bandwidthQuota: { type: Number, default: 0 },
  storageQuota: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
