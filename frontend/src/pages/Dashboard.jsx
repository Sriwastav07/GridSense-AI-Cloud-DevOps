import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { 
  Database, Zap, AlertTriangle, ShieldCheck, Battery, Power, Clock, RefreshCw, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const { token, socket } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.ok ? await res.json() : null;
      if (json) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('telemetry', fetchDashboardData);
      socket.on('incident_created', fetchDashboardData);
      socket.on('incident_updated', fetchDashboardData);
      socket.on('power_restored', fetchDashboardData);

      return () => {
        socket.off('telemetry', fetchDashboardData);
        socket.off('incident_created', fetchDashboardData);
        socket.off('incident_updated', fetchDashboardData);
        socket.off('power_restored', fetchDashboardData);
      };
    }
  }, [socket]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Synchronizing real-time grid metrics...</p>
      </div>
    );
  }

  const { kpis, charts, recentAlerts } = data;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-8">
      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-blue-500/10">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Substations</span>
            <div className="bg-blue-600/10 p-2 rounded-xl"><Layers className="h-5 w-5 text-blue-500" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{kpis.totalSubstations}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">100% Operational</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-blue-500/10">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Feeders</span>
            <div className="bg-blue-600/10 p-2 rounded-xl"><Zap className="h-5 w-5 text-blue-500" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{kpis.totalFeeders}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">31 Active Circuits</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-blue-500/10">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transformers</span>
            <div className="bg-blue-600/10 p-2 rounded-xl"><Database className="h-5 w-5 text-blue-500" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{kpis.totalTransformers}</h3>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Units distributed</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-blue-500/10">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grid Availability</span>
            <div className="bg-emerald-600/10 p-2 rounded-xl"><ShieldCheck className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white">{kpis.powerAvailability}%</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">Optimal Range</p>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-blue-500/10">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Outages</span>
            <div className="bg-red-600/10 p-2 rounded-xl"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-red-400">{kpis.activeIncidents}</h3>
            <p className="text-[10px] text-red-400 font-semibold mt-1">{kpis.activeIncidents > 0 ? 'Urgent attention' : 'All clear'}</p>
          </div>
        </motion.div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Faults */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6">Daily Outages / Faults Today</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyFaults}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Bar dataKey="faults" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Power Loss Trend */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6">Estimated Power Loss (MW Trend)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.powerLossTrend}>
                <defs>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="loss" stroke="#DC2626" fillOpacity={1} fill="url(#colorLoss)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Incident MTTR */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6">Mean Time To Resolution (MTTR Minutes)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.incidentResolutionTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="mttr" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Battery Health Distribution */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6">Pole Micro-Battery Backup Health</h4>
          <div className="h-72 flex flex-col md:flex-row items-center justify-around">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.batteryHealthDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.batteryHealthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 md:mt-0 text-xs text-gray-300">
              {charts.batteryHealthDistribution.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></span>
                  <span>{item.name}: <b>{item.value} poles</b></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SYSTEM LOGS */}
      <div className="glass-card rounded-2xl p-6 border border-white/5">
        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6">Recent Live Grid Operations & Timeline</h4>
        {recentAlerts.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No recent alerts recorded.</p>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {recentAlerts.map((log) => (
              <div key={log._id} className="flex gap-4 items-start border-l-2 border-blue-600/30 pl-4 py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">{log.message}</p>
                  <span className="text-[10px] text-gray-500 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
