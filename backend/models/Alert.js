const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // "POWER_LOST", "INCIDENT_CREATED", "POWER_RESTORED", "DEVICE_OFFLINE"
  message: { type: String, required: true },
  poleId: { type: String },
  incidentId: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
