import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, RefreshCw, CheckCircle, HelpCircle, Eye, ShieldAlert, Users, FileText
} from 'lucide-react';

export default function Incidents() {
  const { token, socket } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.ok ? await res.json() : [];
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    if (socket) {
      socket.on('incident_created', fetchIncidents);
      socket.on('incident_updated', fetchIncidents);
      socket.on('power_restored', fetchIncidents);

      return () => {
        socket.off('incident_created', fetchIncidents);
        socket.off('incident_updated', fetchIncidents);
        socket.off('power_restored', fetchIncidents);
      };
    }
  }, [socket]);

  const handleUpdateStatus = async (incidentId, status) => {
    try {
      await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchIncidents();
      setSelectedIncident(null);
    } catch (err) {
      console.error(err);
    }
  };

  const exportPDF = (incident) => {
    const dataStr = `
      GRID SENSE AI - INCIDENT REPORT
      ===================================
      Incident ID: ${incident.incidentId}
      Feeder ID: ${incident.feederId}
      Suspected Location: ${incident.faultLocation}
      Severity Rating: ${incident.severity}
      Estimated Affected Houses: ${incident.affectedHouses}
      Current status: ${incident.status}
      Assigned Engineer: ${incident.assignedEngineer}
      ETA: ${incident.eta}
      AI Confidence Score: ${incident.aiConfidenceScore}%
      Timeline:
      ${incident.timeline.map(t => `- [${new Date(t.timestamp).toLocaleTimeString()}] ${t.event}: ${t.description}`).join('\n')}
    `;

    const blob = new Blob([dataStr], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gridsense_incident_${incident.incidentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Loading distribution incidents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Incident Management</h2>
        <p className="text-gray-400 text-xs">Verify automated fault telemetry detections, dispatch utility engineers, and resolve network outages.</p>
      </div>

      {/* TABLE VIEW */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Outages and Active Incidents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Incident ID</th>
                <th className="px-6 py-4">Feeder ID / Location</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Houses affected</th>
                <th className="px-6 py-4">Assigned Engineer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No active or historical incidents found.</td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-900/10">
                    <td className="px-6 py-4 font-bold text-white">{inc.incidentId}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{inc.feederId}</p>
                      <p className="text-[10px] text-gray-500">{inc.faultLocation}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inc.severity === 'Critical' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : inc.severity === 'High' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{inc.affectedHouses}</td>
                    <td className="px-6 py-4 font-semibold text-gray-400">{inc.assignedEngineer}</td>
                    <td className="px-6 py-4">
                      <span className={`h-2.5 w-2.5 rounded-full inline-block mr-2 ${
                        inc.status === 'Active' 
                          ? 'bg-red-500 animate-pulse' 
                          : inc.status === 'Resolved' 
                            ? 'bg-emerald-500' 
                            : 'bg-gray-500'
                      }`}></span>
                      <span className="font-semibold text-[11px] text-white">{inc.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 py-1.5 px-3 rounded-lg font-bold"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => exportPDF(inc)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded-lg font-bold"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INCIDENT PAGE/OVERLAY */}
      {selectedIncident && (
        <div className="glass-card rounded-2xl p-6 border border-blue-500/10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <span className={`h-4.5 w-4.5 rounded-full ${selectedIncident.status === 'Active' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <h3 className="text-xl font-bold text-white">Incident Details: {selectedIncident.incidentId}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">AI Root Cause Suggestion</span>
                <span className="font-semibold text-white">{selectedIncident.suggestedRootCause}</span>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">AI Confidence Rating</span>
                <span className="font-semibold text-emerald-400">{selectedIncident.aiConfidenceScore}% Match</span>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Engineering Dispatch ETA</span>
                <span className="font-semibold text-white">{selectedIncident.eta}</span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Incident History Timeline</span>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedIncident.timeline.map((item, i) => (
                  <div key={i} className="text-xs bg-slate-950/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{item.event}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              {selectedIncident.status === 'Active' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.incidentId, 'Resolved')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                  >
                    Resolve Incident
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.incidentId, 'Ignored')}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                  >
                    Ignore Event
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-4">Affected Physical Poles</span>
              <div className="flex flex-wrap gap-2">
                {selectedIncident.affectedPoles.map(p => (
                  <span key={p} className="px-2.5 py-1.5 bg-slate-950 border border-white/5 rounded-lg text-[10px] font-bold text-white">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-white/5 pt-6 text-xs space-y-2 text-gray-400">
              <p>Engineer Assigned: <b className="text-white">{selectedIncident.assignedEngineer}</b></p>
              <p>Feeder Affected: <b className="text-white">{selectedIncident.feederId}</b></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
