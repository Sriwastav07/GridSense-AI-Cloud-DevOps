const express = require('express');
const Substation = require('../models/Substation');
const Feeder = require('../models/Feeder');
const Transformer = require('../models/Transformer');
const Pole = require('../models/Pole');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    // =========================
    // KPI COUNTS
    // =========================
    const totalSubstations = await Substation.countDocuments();
    const totalFeeders = await Feeder.countDocuments();
    const totalTransformers = await Transformer.countDocuments();
    const totalPoles = await Pole.countDocuments();

    const healthyPoles = await Pole.countDocuments({
      status: 'Power ON'
    });

    const offlinePoles = await Pole.countDocuments({
      status: 'Offline Device'
    });

    const activeIncidents = await Incident.countDocuments({
      status: 'Active'
    });

    const recentAlertsCount = await Alert.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    const recentAlerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const powerAvailability =
      totalPoles > 0
        ? Number(((healthyPoles / totalPoles) * 100).toFixed(1))
        : 100;

    // =========================
    // DAILY FAULTS (Last 7 Days)
    // =========================

    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const count = await Incident.countDocuments({
        createdAt: {
          $gte: start,
          $lt: end
        }
      });

      last7Days.push({
        day: start.toLocaleDateString('en-US', {
          weekday: 'short'
        }),
        faults: count
      });
    }

    // =========================
    // MONTHLY OUTAGES
    // =========================

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    const monthCounter = {};

    monthNames.forEach((m) => {
      monthCounter[m] = 0;
    });

    const incidents = await Incident.find();

    incidents.forEach((incident) => {
      const month = monthNames[new Date(incident.createdAt).getMonth()];
      monthCounter[month]++;
    });

    const monthlyOutages = monthNames.map((month) => ({
      month,
      outages: monthCounter[month]
    }));

    // =========================
    // TRANSFORMER RELIABILITY
    // =========================

    const transformers = await Transformer.find();

    const transformerReliability = await Promise.all(
      transformers.map(async (tx) => {
        const faults = await Incident.countDocuments({
          transformerId: tx.transformerId
        });

        return {
          unit: tx.transformerId,
          score: Math.max(70, 100 - faults * 5)
        };
      })
    );

    // Top 10 only
    transformerReliability.sort((a, b) => b.score - a.score);

    // =========================
    // FEEDER TRIPS
    // =========================

    const feeders = await Feeder.find();

    const feederTrips = await Promise.all(
      feeders.map(async (feeder) => {
        const trips = await Incident.countDocuments({
          feederId: feeder.feederId
        });

        return {
          feeder: feeder.feederId,
          trips
        };
      })
    );

    feederTrips.sort((a, b) => b.trips - a.trips);

    // =========================
    // BATTERY HEALTH
    // =========================

    const batteryHealthyCount = await Pole.countDocuments({
      battery: { $gte: 75 }
    });

    const batteryWarningCount = await Pole.countDocuments({
      battery: {
        $gte: 30,
        $lt: 75
      }
    });

    const batteryCriticalCount = await Pole.countDocuments({
      battery: { $lt: 30 }
    });

    const batteryHealthDistribution = [
      {
        name: 'Healthy',
        value: batteryHealthyCount
      },
      {
        name: 'Warning',
        value: batteryWarningCount
      },
      {
        name: 'Critical',
        value: batteryCriticalCount
      }
    ];

    // =========================
    // BATTERY FORECAST
    // =========================

    const avgBattery = await Pole.aggregate([
      {
        $group: {
          _id: null,
          avgBattery: {
            $avg: '$battery'
          }
        }
      }
    ]);

    const currentBattery =
      avgBattery.length > 0 ? avgBattery[0].avgBattery : 100;

    const batteryForecast = [
      {
        year: '2026',
        capacity: Number(currentBattery.toFixed(1))
      },
      {
        year: '2027',
        capacity: Number((currentBattery - 5).toFixed(1))
      },
      {
        year: '2028',
        capacity: Number((currentBattery - 10).toFixed(1))
      },
      {
        year: '2029',
        capacity: Number((currentBattery - 15).toFixed(1))
      },
      {
        year: '2030',
        capacity: Number((currentBattery - 20).toFixed(1))
      }
    ];

    // =========================
    // POWER LOSS TREND
    // =========================

    const powerLossTrend = [
      {
        time: '00:00',
        loss: activeIncidents * 0.5
      },
      {
        time: '04:00',
        loss: activeIncidents * 0.8
      },
      {
        time: '08:00',
        loss: activeIncidents * 1.2
      },
      {
        time: '12:00',
        loss: activeIncidents * 1.5
      },
      {
        time: '16:00',
        loss: activeIncidents * 1.8
      },
      {
        time: '20:00',
        loss: activeIncidents
      }
    ];

    // =========================
    // MTTR
    // =========================

    const incidentResolutionTime = [
      { month: 'Jan', mttr: 120 },
      { month: 'Feb', mttr: 110 },
      { month: 'Mar', mttr: 96 },
      { month: 'Apr', mttr: 89 },
      { month: 'May', mttr: 82 },
      { month: 'Jun', mttr: 75 },
      { month: 'Jul', mttr: 70 }
    ];

    // =========================
    // RESPONSE
    // =========================

    return res.json({
      kpis: {
        totalSubstations,
        totalFeeders,
        totalTransformers,
        totalPoles,
        healthyPoles,
        offlinePoles,
        activeIncidents,
        recentAlertsCount,
        powerAvailability,
        faultsToday: activeIncidents
      },

      charts: {
        dailyFaults: last7Days,
        monthlyOutages,
        transformerReliability,
        feederTrips,
        batteryForecast,
        batteryHealthDistribution,
        powerLossTrend,
        incidentResolutionTime
      },

      recentAlerts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
});

module.exports = router;