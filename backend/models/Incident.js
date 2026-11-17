const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  feederId: { type: String, required: true },
  transformerId: { type: String }, // can be nullable if multi-transformer
  faultLocation: { type: String, required: true }, // e.g. "Between P2 and P3"
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  affectedHouses: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Resolved', 'Ignored'], default: 'Active' },
  assignedEngineer: { type: String, default: 'Unassigned' },
  eta: { type: String, default: '2 hours' },
  suggestedRootCause: { type: String, default: 'Line Trip' },
  aiConfidenceScore: { type: Number, default: 85 },
  affectedPoles: [{ type: String }], // Array of Pole IDs
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    event: { type: String, required: true },
    description: { type: String }
  }],
  repairHistory: [{
    action: { type: String },
    performedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
