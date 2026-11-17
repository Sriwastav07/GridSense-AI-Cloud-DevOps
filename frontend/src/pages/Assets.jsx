import { useState, useEffect } from "react";
import { API_BASE_URL } from '../config.js';
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Database,
  AlertTriangle,
} from "lucide-react";

export default function Assets() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("poles");
  const [search, setSearch] = useState("");

  // Form states for CRUD
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState({
    poleId: "",
    transformerId: "TX-1001",
    feederId: "FDR-101",
    substationId: "SUB-01",
    lat: 40.7128,
    lng: -74.006,
    sequence: 1,
    status: "Power ON",
  });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/assets/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.ok) ? await res.json() : null;
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
    fetchAssets();
  }, [token]);

  const handleDelete = async (id, collection) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await fetch(`/api/assets/${collection}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isEdit
        ? `/api/assets/poles/${selectedId}`
        : "/api/assets/poles";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        coordinates: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
      };

      await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setShowForm(false);
      setIsEdit(false);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (p) => {
    setIsEdit(true);
    setSelectedId(p.poleId);
    setFormData({
      poleId: p.poleId,
      transformerId: p.transformerId,
      feederId: p.feederId,
      substationId: p.substationId,
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      sequence: p.sequence,
      status: p.status,
    });
    setShowForm(true);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <RefreshCw className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 text-sm">
          Synchronizing physical asset arrays...
        </p>
      </div>
    );
  }

  const { substations, feeders, transformers, poles } = data;

  const filteredPoles = poles.filter((p) =>
    p.poleId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Physical Assets CRUD
          </h2>
          <p className="text-gray-400 text-xs">
            Provision substations, manage transformer routing boundaries, and
            register grid hardware.
          </p>
        </div>
        {activeTab === "poles" && (
          <button
            onClick={() => {
              setIsEdit(false);
              setFormData({
                poleId: `POL-${Math.floor(10000 + Math.random() * 90000)}`,
                transformerId: "TX-1001",
                feederId: "FDR-101",
                substationId: "SUB-01",
                lat: 40.7128,
                lng: -74.006,
                sequence: 1,
                status: "Power ON",
              });
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/15"
          >
            <Plus className="h-4 w-4" />
            Add Pole Asset
          </button>
        )}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-white/5 gap-6">
        {["substations", "feeders", "transformers", "poles"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold uppercase tracking-wider pb-3 transition-all border-b-2 ${
              activeTab === tab
                ? "text-blue-500 border-blue-500"
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CRUD TABLES */}
      {activeTab === "poles" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Poles by ID..."
                className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/40 text-gray-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Pole ID</th>
                    <th className="px-6 py-4">Transformer ID</th>
                    <th className="px-6 py-4">Feeder ID</th>
                    <th className="px-6 py-4">Coordinates</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {filteredPoles.slice(0, 50).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-900/10">
                      <td className="px-6 py-4 font-bold text-white">
                        {p.poleId}
                      </td>
                      <td className="px-6 py-4">{p.transformerId}</td>
                      <td className="px-6 py-4">{p.feederId}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {p.coordinates.lat.toFixed(4)},{" "}
                        {p.coordinates.lng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            p.status === "Power ON"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-blue-400 hover:text-blue-300 p-1 bg-blue-600/10 rounded border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.poleId, "poles")}
                          className="text-red-400 hover:text-red-300 p-1 bg-red-600/10 rounded border border-red-500/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "substations" && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Substation ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Coordinates</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-gray-300">
                {substations.map((sub) => (
                  <tr
                    key={sub._id}
                    className="hover:bg-slate-900/20 transition"
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      {sub.substationId}
                    </td>

                    <td className="px-6 py-4">{sub.name}</td>

                    <td className="px-6 py-4">{sub.capacityMW} MW</td>

                    <td className="px-6 py-4 text-gray-500">
                      {sub.coordinates.lat.toFixed(4)},{" "}
                      {sub.coordinates.lng.toFixed(4)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "feeders" && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Feeder ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Substation</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {feeders.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {f.feederId}
                    </td>

                    <td className="px-6 py-4">{f.name}</td>

                    <td className="px-6 py-4">{f.substationId}</td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transformers" && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Transformer ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Feeder</th>
                  <th className="px-6 py-4">Substation</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {transformers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {t.transformerId}
                    </td>

                    <td className="px-6 py-4">{t.name}</td>

                    <td className="px-6 py-4">{t.feederId}</td>

                    <td className="px-6 py-4">{t.substationId}</td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIALOG FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-8 border border-blue-500/20 relative">
            <h3 className="text-lg font-bold text-white mb-6">
              {isEdit ? "Edit Pole Asset" : "Provision New Pole Asset"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Pole ID</label>
                <input
                  type="text"
                  value={formData.poleId}
                  disabled={isEdit}
                  onChange={(e) =>
                    setFormData({ ...formData, poleId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData({ ...formData, lat: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) =>
                      setFormData({ ...formData, lng: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
