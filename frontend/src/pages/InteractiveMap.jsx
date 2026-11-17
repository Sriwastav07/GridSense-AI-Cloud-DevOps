import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, RefreshCw, AlertTriangle, ShieldCheck, Cpu, Battery, Eye, Activity, PlusCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Setup default marker icon because of Leaflet default asset bundling issues in modern bundles
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function InteractiveMap() {
  const { token, socket } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPole, setSelectedPole] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedSub, setExpandedSub] = useState({});

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/map`, {
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
    fetchData();

    if (socket) {
      socket.on('telemetry', fetchData);
      socket.on('power_restored', fetchData);
      return () => {
        socket.off('telemetry', fetchData);
        socket.off('power_restored', fetchData);
      };
    }
  }, [socket]);

  const handlePoleClick = async (pole) => {
    setSelectedPole(pole);
    // Fetch individual telemetry history
    try {
      const res = await fetch(`/api/telemetry?poleId=${pole.poleId}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logs = await res.ok ? await res.json() : [];
      setHistory(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateFault = async () => {
    if (!selectedPole) return;
    try {
      await fetch('/api/simulator/fault', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ numPoles: 3 })
      });
      fetchData();
      setSelectedPole(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestorePower = async () => {
    try {
      await fetch('/api/simulator/restore', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      fetchData();
      setSelectedPole(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">Synchronizing live GIS datasets...</p>
      </div>
    );
  }

  const { substations, transformers, poles } = data;

  // Helpers to get styling and hierarchy
  const getStatusColor = (status) => {
    switch (status) {
      case 'Power ON': return 'bg-emerald-500';
      case 'Power OFF': return 'bg-red-500 animate-pulse';
      case 'Suspected Fault': return 'bg-amber-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getMarkerColor = (status) => {
    switch (status) {
      case 'Power ON': return '#10B981';
      case 'Power OFF': return '#EF4444';
      case 'Suspected Fault': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Map & Feeder Hierarchy</h2>
        <p className="text-gray-400 text-xs">Live GIS Distribution Visualization and Tree Path.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAP COLUMN */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 flex flex-col h-[550px] relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">GIS Map View (Leaflet OpenStreetMap)</span>
            <div className="flex gap-4 text-[10px] text-gray-400 font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Live</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Fault</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Suspected</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-500"></span> Offline</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-950/40 rounded-xl relative overflow-hidden border border-white/5">
            <MapContainer center={[40.7128, -74.0060]} zoom={13} className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Render Substations as Markers */}
              {substations.map(sub => (
                <Marker 
                  key={sub.substationId} 
                  position={[sub.coordinates.lat, sub.coordinates.lng]}
                >
                  <Popup>
                    <div className="text-xs text-slate-900">
                      <p className="font-bold">{sub.name}</p>
                      <p>Status: {sub.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render Poles as Markers */}
              {poles.slice(0, 80).map(p => (
                <Marker 
                  key={p.poleId} 
                  position={[p.coordinates.lat, p.coordinates.lng]}
                  eventHandlers={{
                    click: () => handlePoleClick(p),
                  }}
                >
                  <Popup>
                    <div className="text-xs text-slate-900">
                      <p className="font-bold">Pole: {p.poleId}</p>
                      <p>Voltage: {p.voltage}V</p>
                      <p>Battery: {p.battery}%</p>
                      <p>Status: {p.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Draw Distribution Lines connecting consecutive poles */}
              {poles.slice(0, 40).map((p, i) => {
                if (i === 0) return null;
                const prev = poles[i - 1];
                if (prev.feederId !== p.feederId) return null;
                return (
                  <Polyline 
                    key={i} 
                    positions={[
                      [prev.coordinates.lat, prev.coordinates.lng],
                      [p.coordinates.lat, p.coordinates.lng]
                    ]} 
                    color={getMarkerColor(p.status)}
                    weight={3}
                  />
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* FEEDER HIERARCHY TREE COLUMN */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 h-[550px] overflow-y-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-4">Feeder Hierarchy (Tree View)</span>
          
          <div className="space-y-4">
            {substations.map(sub => (
              <div key={sub.substationId} className="border-l border-blue-500/20 pl-4 py-1">
                <button 
                  onClick={() => setExpandedSub(prev => ({ ...prev, [sub.substationId]: !prev[sub.substationId] }))}
                  className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all text-left"
                >
                  <Cpu className="h-4 w-4" />
                  {sub.name}
                </button>

                {expandedSub[sub.substationId] && (
                  <div className="mt-3 pl-4 space-y-3">
                    {transformers.filter(tx => tx.substationId === sub.substationId).slice(0, 3).map(tx => (
                      <div key={tx.transformerId} className="border-l border-gray-700 pl-3">
                        <p className="text-[11px] font-semibold text-gray-300 flex items-center gap-2">
                          <PlusCircle className="h-3 w-3 text-emerald-500" />
                          {tx.name}
                        </p>
                        
                        <div className="mt-1 pl-4 space-y-1">
                          {poles.filter(p => p.transformerId === tx.transformerId).slice(0, 4).map(p => (
                            <button
                              key={p.poleId}
                              onClick={() => handlePoleClick(p)}
                              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1.5"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${getStatusColor(p.status)}`}></span>
                              {p.poleId} (Seq {p.sequence})
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CLICKED DETAILS MODAL / FOOTER EXPANSION */}
      {selectedPole && (
        <div className="glass-card rounded-2xl p-6 border border-blue-500/10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`h-4.5 w-4.5 rounded-full ${getStatusColor(selectedPole.status)}`}></span>
              <h3 className="text-lg font-bold text-white">Device Details: {selectedPole.poleId}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Status</span>
                <span className="font-semibold text-white">{selectedPole.status}</span>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Voltage</span>
                <span className="font-semibold text-white">{selectedPole.voltage} V</span>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Battery backup</span>
                <span className="font-semibold text-white">{selectedPole.battery}%</span>
              </div>
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Last Seen</span>
                <span className="font-semibold text-white">{new Date(selectedPole.lastSeen).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGenerateFault}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                <AlertTriangle className="h-4 w-4" />
                Generate Fault
              </button>
              <button
                onClick={handleRestorePower}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Restore Power
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Telemetry Log History
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-[11px] text-gray-500">No history available for this node</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] bg-slate-950/30 border border-white/5 rounded-lg p-2.5">
                    <span className="text-gray-300 font-semibold">{h.event}</span>
                    <span className="text-gray-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
