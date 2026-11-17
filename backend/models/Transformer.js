const mongoose = require('mongoose');

const transformerSchema = new mongoose.Schema({
  transformerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  feederId: { type: String, required: true, ref: 'Feeder' },
  substationId: { type: String, required: true, ref: 'Substation' },
  status: { type: String, enum: ['Power ON', 'Power OFF', 'Suspected Fault', 'Offline Device'], default: 'Power ON' }
}, { timestamps: true });

module.exports = mongoose.model('Transformer', transformerSchema);
