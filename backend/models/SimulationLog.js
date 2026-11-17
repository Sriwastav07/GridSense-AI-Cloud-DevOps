const mongoose = require('mongoose');

const simulationLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { type: String, required: true }, // "RANDOM_FAULT", "RESTORE_POWER", "BATTERY_FAILURE", "COMM_FAILURE", "STORM_MODE", "MASS_OUTAGE"
  description: { type: String, required: true },
  affectedPolesCount: { type: Number, default: 0 },
  operator: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('SimulationLog', simulationLogSchema);
