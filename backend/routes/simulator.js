const express = require('express');
const Pole = require('../models/Pole');
const Feeder = require('../models/Feeder');
const SimulationLog = require('../models/SimulationLog');
const { processTelemetryEvent } = require('../services/faultEngine');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const router = express.Router();

// POST /api/simulator/fault
router.post('/fault', async (req, res) => {
  try {
    const { numPoles, delay, type } = req.body;
    const activeType = type || 'RANDOM_FAULT';

    // Fetch random feeder line to target
    const feeder = await Feeder.findOne();
    if (!feeder) {
      return res.status(404).json({ message: 'No feeders available for simulation' });
    }

    // Find poles on this feeder
    const poles = await Pole.find({ feederId: feeder.feederId }).sort({ sequence: 1 });
    if (poles.length === 0) {
      return res.status(404).json({ message: 'No poles on feeder' });
    }

    const targetCount = Math.min(numPoles || 3, poles.length);
    // Fault downstream: we turn off poles starting at a certain point
    const startIndex = Math.max(0, poles.length - targetCount);
    const affectedPoles = [];

    const io = req.app.get('io');

    for (let i = startIndex; i < poles.length; i++) {
      const p = poles[i];
      p.status = 'Power OFF';
      p.voltage = 0;
      await p.save();
      affectedPoles.push(p.poleId);

      // Trigger telemetry event sequence
      const telEvent = {
        timestamp: new Date(),
        poleId: p.poleId,
        event: 'POWER_LOSS',
        battery: Math.max(10, p.battery - 5),
        sequence: p.sequence,
        signal: p.signal,
        firmware: p.firmware,
        status: 'Power OFF',
        voltage: 0
      };

      // Run through Fault Engine
      await processTelemetryEvent(telEvent, io);

      if(delay && delay > 0){
        await sleep(delay*1000);
      }
    }

    // Log simulation activity
    const log = new SimulationLog({
      type: activeType,
      description: `Simulated fault on Feeder ${feeder.feederId} starting at pole ${poles[startIndex].poleId}`,
      affectedPolesCount: affectedPoles.length
    });
    await log.save();

    return res.json({
      message: 'Fault simulation complete',
      affectedPoles,
      feederId: feeder.feederId
    });
  } catch (err) {
    console.error('Simulation fault error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/simulator/restore
router.post('/restore', async (req, res) => {
  try {
    const io = req.app.get('io');
    const poles = await Pole.find({ status: { $ne: 'Power ON' } });

    for (let p of poles) {
      p.status = 'Power ON';
      p.voltage = 240;
      await p.save();

      const telEvent = {
        timestamp: new Date(),
        poleId: p.poleId,
        event: 'POWER_RESTORE',
        battery: 100,
        sequence: p.sequence,
        signal: p.signal,
        firmware: p.firmware,
        status: 'Power ON',
        voltage: 240
      };

      await processTelemetryEvent(telEvent, io);
    }

    const log = new SimulationLog({
      type: 'RESTORE_POWER',
      description: 'Restored power across entire electrical grid',
      affectedPolesCount: poles.length
    });
    await log.save();

    return res.json({ message: 'Power restoration complete', restoredCount: poles.length });
  } catch (err) {
    console.error('Simulation restore error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
