import { useEffect, useState } from "react";
import { API_BASE_URL } from '../config.js';
import { useAuth } from "../context/AuthContext";
import {
  Settings2,
  Bell,
  Sliders,
  Save,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState("dark");
  const [toastAlerts, setToastAlerts] = useState(true);
  const [outageThreshold, setOutageThreshold] = useState(15);
  const [simulationSpeed, setSimulationSpeed] = useState(2);

  // Load settings
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      setTheme(data.theme || "dark");
      setToastAlerts(data.toastAlerts);
      setOutageThreshold(data.outageThreshold);
      setSimulationSpeed(data.simulationSpeed);
    } catch (err) {
      console.error(err);
      alert("Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  // Save settings
  async function handleSave() {
    try {
      setSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme,
          toastAlerts,
          outageThreshold,
          simulationSpeed,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      alert("Configuration saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to save configuration.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">

      <div>
        <h2 className="text-2xl font-bold text-white">
          System Settings
        </h2>

        <p className="text-gray-400 text-xs">
          Configure GridSense telemetry thresholds and simulator behaviour.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-8">

        {/* Theme */}

        <div>

          <h3 className="flex items-center gap-2 font-bold text-gray-300 mb-4">
            <Settings2 className="w-5 h-5 text-blue-500" />
            Visual Theme
          </h3>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-slate-900 rounded-xl border border-white/10 p-3 text-white"
          >
            <option value="dark">
              Professional Dark Theme
            </option>

            <option value="light">
              High Contrast Light
            </option>

          </select>

        </div>

        {/* Toast */}

        <div>

          <h3 className="flex items-center gap-2 font-bold text-gray-300 mb-4">
            <Bell className="w-5 h-5 text-amber-500" />
            Notifications
          </h3>

          <label className="flex justify-between items-center">

            <span className="text-white">
              Enable Toast Alerts
            </span>

            <input
              type="checkbox"
              checked={toastAlerts}
              onChange={(e) => setToastAlerts(e.target.checked)}
            />

          </label>

        </div>

        {/* Outage */}

        <div>

          <h3 className="font-bold text-gray-300 mb-4">
            Outage Trigger Voltage
          </h3>

          <div className="flex justify-between mb-2">

            <span>{outageThreshold} V</span>

          </div>

          <input
            type="range"
            min={5}
            max={50}
            value={outageThreshold}
            onChange={(e) =>
              setOutageThreshold(Number(e.target.value))
            }
            className="w-full"
          />

        </div>

        {/* Simulation */}

        <div>

          <h3 className="flex items-center gap-2 font-bold text-gray-300 mb-4">
            <Sliders className="w-5 h-5 text-purple-500" />
            Simulation Speed
          </h3>

          <div className="flex justify-between mb-2">

            <span>{simulationSpeed}x</span>

          </div>

          <input
            type="range"
            min={1}
            max={5}
            value={simulationSpeed}
            onChange={(e) =>
              setSimulationSpeed(Number(e.target.value))
            }
            className="w-full"
          />

        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-white flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>

      </div>

    </div>
  );
}
