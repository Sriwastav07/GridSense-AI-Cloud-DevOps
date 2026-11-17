const express = require("express");
const router = express.Router();

const Settings = require("../models/Settings");

/*
GET Settings
*/
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        theme: "dark",
        toastAlerts: true,
        outageThreshold: 15,
        simulationSpeed: 2,
      });
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to load settings",
    });
  }
});

/*
Update Settings
*/
router.post("/", async (req, res) => {
  try {
    const {
      theme,
      toastAlerts,
      outageThreshold,
      simulationSpeed,
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    settings.theme = theme;
    settings.toastAlerts = toastAlerts;
    settings.outageThreshold = outageThreshold;
    settings.simulationSpeed = simulationSpeed;

    await settings.save();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to save settings",
    });
  }
});

module.exports = router;