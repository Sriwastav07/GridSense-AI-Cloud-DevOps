import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { 
  RefreshCw, Search, Filter, Signal, Battery, AlertCircle, Wifi
} from 'lucide-react';

export default function Telemetry() {
  const { token, socket } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTelemetry = async () => {
    try {
      const query = [];
      if (search) query.push(`poleId=${search}`);
      if (statusFilter) query.push(`status=${statusFilter}`);

      const res = await fetch(`${API_BASE_URL}/api/telemetry?${query.join('&')}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.ok ? await res.json() : [];
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();

    if (socket) {
      const handleTelemetry = (payload) => {
        setLogs(prev => [payload, ...prev].slice(0, 100));
      };

      socket.on('telemetry', handleTelemetry);
      return () => {
        socket.off('telemetry', handleTelemetry);
      };
    }
  }, [socket, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Streaming live telemetry packets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Telemetry Stream logs</h2>
          <p className="text-gray-400 text-xs">Live incoming signals from distributed micro-sensor arrays.</p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Pole ID..."
              className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Power ON">Power ON</option>
              <option value="Power OFF">Power OFF</option>
              <option value="Suspected Fault">Suspected Fault</option>
            </select>
          </div>
        </div>

        <button 
          onClick={fetchTelemetry}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </button>
      </div>

      {/* DATA STREAM PACKETS */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Pole ID</th>
                <th className="px-6 py-4">Telemetry Event</th>
                <th className="px-6 py-4">Voltage</th>
                <th className="px-6 py-4">Battery</th>
                <th className="px-6 py-4">Sequence</th>
                <th className="px-6 py-4">Signal</th>
                <th className="px-6 py-4">Firmware</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No telemetry packets received.</td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-bold text-white">{log.poleId}</td>
                    <td className="px-6 py-4 font-semibold text-blue-400">{log.event}</td>
                    <td className="px-6 py-4 font-semibold">{log.voltage}V</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Battery className={`h-3.5 w-3.5 ${log.battery < 30 ? 'text-red-500' : 'text-emerald-500'}`} />
                        {log.battery}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{log.sequence}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3.5 w-3.5 text-blue-400" />
                        {log.signal} dBm
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{log.firmware}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        log.status === 'Power ON' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
