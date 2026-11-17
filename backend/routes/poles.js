const express = require('express');
const Pole = require('../models/Pole');

const router = express.Router();

// GET /api/poles
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.poleId = { $regex: search, $options: 'i' };
    }

    const poles = await Pole.find(query).limit(100);
    return res.json(poles);
  } catch (err) {
    console.error('Error fetching poles:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
