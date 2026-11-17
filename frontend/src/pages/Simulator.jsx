import { useState } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { 
  Play, RefreshCw, AlertTriangle, Battery, ShieldAlert, WifiOff, Users, Settings2, Sparkles, Activity
} from 'lucide-react';

export default function Simulator() {
  const { token } = useAuth();
  const [numPoles, setNumPoles] = useState(3);
  const [delay, setDelay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const triggerAction = async (endpoint, payload = {}) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/simulator/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      const newLog = {
        action: endpoint.toUpperCase(),
        timestamp: new Date().toLocaleTimeString(),
        message: data.message || 'Simulation executed successfully'
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Electrical Fault & Load Simulator</h2>
        <p className="text-gray-400 text-xs">Inject faults, disconnect communication arrays, trigger storm configurations, and test edge states.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CONTROL CONFIGURATIONS */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-3">Simulation Scenarios & Injections</span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => triggerAction('fault', { numPoles, delay, type: 'RANDOM_FAULT' })}
              disabled={loading}
              className="flex items-center gap-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl p-4 transition-all text-left"
            >
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-xs font-bold">Generate Random Fault</p>
                <p className="text-[10px] text-gray-500">Disconnects sequence path downstream on feeder line</p>
              </div>
            </button>

            <button
              onClick={() => triggerAction('restore')}
              disabled={loading}
              className="flex items-center gap-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl p-4 transition-all text-left"
            >
              <RefreshCw className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-xs font-bold">Restore Grid Power</p>
                <p className="text-[10px] text-gray-500">Brings all offline poles and transformers online</p>
              </div>
            </button>

            <button
              onClick={() => triggerAction('fault', { numPoles: 1, delay, type: 'BATTERY_FAILURE' })}
              disabled={loading}
              className="flex items-center gap-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl p-4 transition-all text-left"
            >
              <Battery className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-xs font-bold">Battery Failure Mode</p>
                <p className="text-[10px] text-gray-500">Simulates complete micro-battery backup drainage</p>
              </div>
            </button>

            <button
              onClick={() => triggerAction('fault', { numPoles: 2, delay, type: 'COMM_FAILURE' })}
              disabled={loading}
              className="flex items-center gap-3 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/20 rounded-xl p-4 transition-all text-left"
            >
              <WifiOff className="h-6 w-6 text-gray-500" />
              <div>
                <p className="text-xs font-bold">Communication Offline</p>
                <p className="text-[10px] text-gray-500">Triggers transmission offline for network packages</p>
              </div>
            </button>

            <button
              onClick={() => triggerAction('fault', { numPoles: 8, delay, type: 'STORM_MODE' })}
              disabled={loading}
              className="flex items-center gap-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl p-4 transition-all text-left"
            >
              <Sparkles className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xs font-bold">Activate Storm Configuration</p>
                <p className="text-[10px] text-gray-500">Injects lightning branch-trips & high wind stress</p>
              </div>
            </button>

            <button
              onClick={() => triggerAction('fault', { numPoles: 15, delay, type: 'MASS_OUTAGE' })}
              disabled={loading}
              className="flex items-center gap-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl p-4 transition-all text-left"
            >
              <ShieldAlert className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-xs font-bold">Mass Outage Event</p>
                <p className="text-[10px] text-gray-500">Brings entire substation grid offline for blackstart testing</p>
              </div>
            </button>
          </div>

          {/* PARAMETERS CONFIG */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Simulation Variables & Tuning</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] text-gray-400 font-bold uppercase flex justify-between">
                  <span>Number of Affected Nodes</span>
                  <span className="text-blue-400">{numPoles} Poles</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={numPoles}
                  onChange={(e) => setNumPoles(parseInt(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-gray-400 font-bold uppercase flex justify-between">
                  <span>Inertial Telemetry Delay</span>
                  <span className="text-blue-400">{delay} Seconds</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATION TIMELINE LOG */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 h-[500px] flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block border-b border-white/5 pb-3">Real-time Simulation Stream</span>

          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No simulation telemetry logs generated yet.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs bg-slate-950/40 border border-white/5 rounded-xl p-3 flex gap-3 items-start">
                  <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-[11px]">{log.action}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{log.message}</p>
                    <span className="text-[9px] text-gray-500 block mt-1">{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
