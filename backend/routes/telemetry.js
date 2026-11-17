const express = require('express');
const Telemetry = require('../models/Telemetry');

const router = express.Router();

// GET /api/telemetry
router.get('/', async (req, res) => {
  try {
    const { poleId, status, limit } = req.query;
    const query = {};

    if (poleId) {
      query.poleId = { $regex: poleId, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    const recordsLimit = parseInt(limit, 10) || 50;
    const records = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(recordsLimit);

    return res.json(records);
  } catch (err) {
    console.error('Error fetching telemetry:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
