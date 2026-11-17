const express = require('express');
const Substation = require('../models/Substation');
const Transformer = require('../models/Transformer');
const Pole = require('../models/Pole');

const router = express.Router();

// GET /api/map
router.get('/', async (req, res) => {
  try {
    const substations = await Substation.find();
    const transformers = await Transformer.find();
    const poles = await Pole.find();

    return res.json({
      substations,
      transformers,
      poles
    });
  } catch (err) {
    console.error('Error fetching map data:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
