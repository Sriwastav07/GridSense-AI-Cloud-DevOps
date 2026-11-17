const express = require('express');
const Incident = require('../models/Incident');
const Pole = require('../models/Pole');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/incidents
router.get('/', async (req, res) => {
  try {
    const { status, severity } = req.query;
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const incidents = await Incident.find(query).sort({ createdAt: -1 });
    return res.json(incidents);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/incidents
router.post('/', async (req, res) => {
  try {
    const { feederId, transformerId, faultLocation, severity, affectedPoles, suggestedRootCause } = req.body;
    
    if (!feederId || !faultLocation) {
      return res.status(400).json({ message: 'feederId and faultLocation are required' });
    }

    const incidentId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
    const incident = new Incident({
      incidentId,
      feederId,
      transformerId,
      faultLocation,
      severity: severity || 'Medium',
      affectedPoles: affectedPoles || [],
      affectedHouses: (affectedPoles || []).length * 15,
      suggestedRootCause: suggestedRootCause || 'Manual Overwrite',
      aiConfidenceScore: 90,
      timeline: [{
        timestamp: new Date(),
        event: 'MANUAL_CREATION',
        description: 'Incident was created manually by operator.'
      }]
    });

    await incident.save();

    // Broadcast update if Socket.io server available
    const io = req.app.get('io');
    if (io) {
      io.emit('incident_created', incident);
    }

    return res.status(201).json(incident);
  } catch (err) {
    console.error('Error creating incident:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, assignedEngineer, eta, repairAction } = req.body;
    const incident = await Incident.findOne({ incidentId: req.params.id });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (status) {
      incident.status = status;
      incident.timeline.push({
        timestamp: new Date(),
        event: 'STATUS_CHANGE',
        description: `Status changed to ${status}`
      });

      // If status changed to Resolved, we must restore power to affected poles!
      if (status === 'Resolved') {
        const poles = await Pole.find({ poleId: { $in: incident.affectedPoles } });
        for (let p of poles) {
          p.status = 'Power ON';
          p.voltage = 240;
          await p.save();

          // Broadcast telemetry restore event
          const io = req.app.get('io');
          if (io) {
            io.emit('telemetry', {
              timestamp: new Date(),
              poleId: p.poleId,
              event: 'POWER_RESTORED',
              battery: p.battery,
              sequence: p.sequence,
              signal: p.signal,
              firmware: p.firmware,
              status: 'Power ON',
              voltage: 240
            });
          }
        }

        // Add alert
        const alertId = `ALT-${Math.floor(100000 + Math.random() * 900000)}`;
        const alert = new Alert({
          alertId,
          type: 'POWER_RESTORED',
          message: `Incident ${incident.incidentId} manually resolved. Power restored to all ${poles.length} poles.`,
          incidentId: incident.incidentId
        });
        await alert.save();
        
        const io = req.app.get('io');
        if (io) {
          io.emit('alert', alert);
        }
      }
    }

    if (assignedEngineer) {
      incident.assignedEngineer = assignedEngineer;
      incident.timeline.push({
        timestamp: new Date(),
        event: 'ENGINEER_ASSIGNED',
        description: `Assigned to ${assignedEngineer}`
      });
    }

    if (eta) {
      incident.eta = eta;
    }

    if (repairAction) {
      incident.repairHistory.push({
        action: repairAction,
        performedBy: assignedEngineer || 'System',
        timestamp: new Date()
      });
    }

    await incident.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('incident_updated', incident);
    }

    return res.json(incident);
  } catch (err) {
    console.error('Error updating incident:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
