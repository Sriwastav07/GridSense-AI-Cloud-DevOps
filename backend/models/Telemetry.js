const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  poleId: { type: String, required: true, ref: 'Pole' },
  event: { type: String, required: true }, // e.g. "HEARTBEAT", "POWER_LOSS", "POWER_RESTORE", "BATTERY_LOW", "COMM_FAILURE"
  battery: { type: Number, required: true },
  sequence: { type: Number, required: true },
  signal: { type: Number, required: true },
  firmware: { type: String, required: true },
  status: { type: String, required: true }, // "Power ON", "Power OFF", "Suspected Fault", "Offline Device"
  voltage: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Telemetry', telemetrySchema);
