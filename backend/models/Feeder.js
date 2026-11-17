const mongoose = require('mongoose');

const feederSchema = new mongoose.Schema({
  feederId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  substationId: { type: String, required: true, ref: 'Substation' },
  status: { type: String, enum: ['Power ON', 'Power OFF', 'Suspected Fault', 'Offline Device'], default: 'Power ON' }
}, { timestamps: true });

module.exports = mongoose.model('Feeder', feederSchema);
