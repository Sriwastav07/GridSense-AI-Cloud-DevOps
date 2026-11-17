const mongoose = require('mongoose');

const substationSchema = new mongoose.Schema({
  substationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  capacityMW: { type: Number, default: 50 },
  status: { type: String, enum: ['Power ON', 'Power OFF', 'Suspected Fault', 'Offline Device'], default: 'Power ON' }
}, { timestamps: true });

module.exports = mongoose.model('Substation', substationSchema);
