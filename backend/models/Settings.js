const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "dark",
    },

    toastAlerts: {
      type: Boolean,
      default: true,
    },

    outageThreshold: {
      type: Number,
      default: 15,
    },

    simulationSpeed: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);