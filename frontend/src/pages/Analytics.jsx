import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Download, RefreshCw, BarChart3, TrendingUp, AlertOctagon, Heart } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, ComposedChart
} from 'recharts';

export default function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate analytics based on real dashboard fetch
    const getAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await res.ok ? await res.json() : null;
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getAnalytics();
  }, [token]);

  const handleExportCSV = () => {
    const csvContent =
      `Metric,Value
      Substations,${data.kpis.totalSubstations}
      Feeders,${data.kpis.totalFeeders}
      Transformers,${data.kpis.totalTransformers}
      Poles,${data.kpis.totalPoles}
      Healthy Poles,${data.kpis.healthyPoles}
      Offline Poles,${data.kpis.offlinePoles}
      Availability,${data.kpis.powerAvailability}%
      Active Incidents,${data.kpis.activeIncidents}
      Alerts Today,${data.kpis.recentAlertsCount}
      `;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gridsense_grid_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Synthesizing analytical models...</p>
      </div>
    );
  }

        // ===============================
      // Data from Backend
      // ===============================

      const monthlyOutages = data.monthlyOutages;
      const transformerReliability = data.transformerReliability;
      const topFailingFeeders = data.topFailingFeeders;
      const batteryForecast = data.batteryForecast;
              

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Analytical Insights</h2>
          <p className="text-gray-400 text-xs">Deep learning electrical grid operations & performance models.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/15"
        >
          <Download className="h-4 w-4" />
          Export CSV Summary
        </button>
      </div>

      {/* CHARTS GRAPH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Outages */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Monthly Outage Distribution
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyOutages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="outages" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Transformer Reliability */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-500" />
              Transformer Unit Reliability Rating
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transformerReliability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="unit" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" domain={[80, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Bar dataKey="score" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Device Health Trends */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-500" />
            Top Failing Feeders (Daily Trips)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFailingFeeders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="_id" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Bar dataKey="trips" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Battery degradation index */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Micro-battery Backup Lifespan Forecast
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={batteryForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" domain={[70, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="capacity" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
