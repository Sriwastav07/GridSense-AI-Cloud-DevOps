const express = require('express');
const Pole = require('../models/Pole');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Incident = require('../models/Incident');
const Telemetry = require('../models/Telemetry');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // =========================
    // Monthly Outages
    // =========================
    const monthlyAgg = await Incident.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          outages: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const monthlyOutages = months.map((m, i) => {
      const found = monthlyAgg.find(x => x._id === i + 1);
      return {
        month: m,
        outages: found ? found.outages : 0
      };
    });

    // =========================
    // Transformer Reliability
    // =========================
    const transformers = await Transformer.find().limit(10);

const transformerReliability = transformers.map(tx => {
  let score = 100;

  switch (tx.status) {
    case "Power ON":
      score = 99;
      break;

    case "Power OFF":
      score = 55;
      break;

    case "Suspected Fault":
      score = 35;
      break;

    case "Offline Device":
      score = 15;
      break;

    default:
      score = 80;
  }

  return {
    unit: tx.transformerId,
    score
  };
});

    // =========================
    // Top Failing Feeders
    // =========================
    const feederAgg = await Incident.aggregate([
      {
        $group: {
          _id: "$feederId",
          trips: { $sum: 1 }
        }
      },
      { $sort: { trips: -1 } },
      { $limit: 5 }
    ]);

    const topFailingFeeders = feederAgg.map(f => ({
      feeder: f._id,
      trips: f.trips
    }));

    // =========================
    // Battery Forecast
    // =========================
    const poles = await Pole.find({}, "battery");

    const avgBattery =
      poles.length > 0
        ? poles.reduce((a, b) => a + (b.battery || 0), 0) / poles.length
        : 100;

    const batteryForecast = [
      { year: "2026", capacity: Math.round(avgBattery) },
      { year: "2027", capacity: Math.max(0, Math.round(avgBattery - 5)) },
      { year: "2028", capacity: Math.max(0, Math.round(avgBattery - 10)) },
      { year: "2029", capacity: Math.max(0, Math.round(avgBattery - 15)) },
      { year: "2030", capacity: Math.max(0, Math.round(avgBattery - 20)) }
    ];

    // =========================
    // Grid KPIs
    // =========================
    const totalPoles = await Pole.countDocuments();
    const healthyPoles = await Pole.countDocuments({
      status: "Power ON"
    });

    const activeIncidents = await Incident.countDocuments({
      status: "Active"
    });

    const totalFeeders = await Feeder.countDocuments();

    const availability =
      totalPoles === 0
        ? 100
        : Number(((healthyPoles / totalPoles) * 100).toFixed(1));

    res.json({
      kpis: {
        totalFeeders,
        totalPoles,
        activeIncidents,
        availability
      },

      monthlyOutages,

      transformerReliability,

      topFailingFeeders,

      batteryForecast
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Analytics error"
    });
  }
});

module.exports = router;