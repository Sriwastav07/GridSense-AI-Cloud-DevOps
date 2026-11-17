const mongoose = require('mongoose');

const poleSchema = new mongoose.Schema({
  poleId: { type: String, required: true, unique: true },
  transformerId: { type: String, required: true, ref: 'Transformer' },
  feederId: { type: String, required: true, ref: 'Feeder' },
  substationId: { type: String, required: true, ref: 'Substation' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  sequence: { type: Number, required: true }, // Sequence order along the Feeder/Transformer line
  status: { type: String, enum: ['Power ON', 'Power OFF', 'Suspected Fault', 'Offline Device'], default: 'Power ON' },
  voltage: { type: Number, default: 240 }, // Normal: ~240V, Fault/Off: 0V
  battery: { type: Number, default: 100 }, // Battery backup health %
  lastSeen: { type: Date, default: Date.now },
  firmware: { type: String, default: 'v1.4.2' },
  signal: { type: Number, default: -65 } // dBm signal strength
}, { timestamps: true });

module.exports = mongoose.model('Pole', poleSchema);
