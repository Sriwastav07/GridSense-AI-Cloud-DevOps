const express = require('express');
const Substation = require('../models/Substation');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Pole = require('../models/Pole');

const router = express.Router();

// GET /api/assets/summary
router.get('/summary', async (req, res) => {
  try {
    const substations = await Substation.find();
    const feeders = await Feeder.find();
    const transformers = await Transformer.find();
    const poles = await Pole.find();
    return res.json({ substations, feeders, transformers, poles });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// SUBSTATIONS CRUD
router.post('/substations', async (req, res) => {
  try {
    const sub = new Substation(req.body);
    await sub.save();
    return res.status(201).json(sub);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put('/substations/:id', async (req, res) => {
  try {
    const sub = await Substation.findOneAndUpdate({ substationId: req.params.id }, req.body, { new: true });
    return res.json(sub);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete('/substations/:id', async (req, res) => {
  try {
    await Substation.findOneAndDelete({ substationId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// FEEDERS CRUD
router.post('/feeders', async (req, res) => {
  try {
    const f = new Feeder(req.body);
    await f.save();
    return res.status(201).json(f);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put('/feeders/:id', async (req, res) => {
  try {
    const f = await Feeder.findOneAndUpdate({ feederId: req.params.id }, req.body, { new: true });
    return res.json(f);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete('/feeders/:id', async (req, res) => {
  try {
    await Feeder.findOneAndDelete({ feederId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// TRANSFORMERS CRUD
router.post('/transformers', async (req, res) => {
  try {
    const t = new Transformer(req.body);
    await t.save();
    return res.status(201).json(t);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put('/transformers/:id', async (req, res) => {
  try {
    const t = await Transformer.findOneAndUpdate({ transformerId: req.params.id }, req.body, { new: true });
    return res.json(t);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete('/transformers/:id', async (req, res) => {
  try {
    await Transformer.findOneAndDelete({ transformerId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// POLES CRUD
router.post('/poles', async (req, res) => {
  try {
    const p = new Pole(req.body);
    await p.save();
    return res.status(201).json(p);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.put('/poles/:id', async (req, res) => {
  try {
    const p = await Pole.findOneAndUpdate({ poleId: req.params.id }, req.body, { new: true });
    return res.json(p);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

router.delete('/poles/:id', async (req, res) => {
  try {
    await Pole.findOneAndDelete({ poleId: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = router;
