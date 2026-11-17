import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Map, AlertTriangle, Activity, 
  Database, Play, BarChart3, Settings, LogOut, Search, Bell, User, ChevronDown
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Interactive Map', icon: Map, path: '/map' },
  { name: 'Incidents', icon: AlertTriangle, path: '/incidents' },
  { name: 'Telemetry Log', icon: Activity, path: '/telemetry' },
  { name: 'Assets Grid', icon: Database, path: '/assets' },
  { name: 'Fault Simulator', icon: Play, path: '/simulator' },
  { name: 'Analytics', icon: BarChart3, path: '/analytics' },
  { name: 'Settings', icon: Settings, path: '/settings' }
];

export default function Layout({ children }) {
  const { user, logout, socket } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (socket) {
      const handleAlert = (alert) => {
        setNotifications(prev => [alert, ...prev].slice(0, 8));
      };

      socket.on('alert', handleAlert);
      return () => {
        socket.off('alert', handleAlert);
      };
    }
  }, [socket]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B1220]">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 glass-panel flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">GridSense AI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-950/40 rounded-xl mb-2">
            <div className="h-9 w-9 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-xs font-bold text-blue-400">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* RIGHT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-16 glass-nav flex items-center justify-between px-8 z-10">
          <div className="w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search poles, feeders, sub-stations..."
              className="w-full bg-slate-950/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-900/40 rounded-xl transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2, w-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl p-4 shadow-xl z-30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 border-b border-white/5 pb-2">Recent System Alerts</h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No recent alerts</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <div key={i} className="text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          <p className="font-semibold text-white">{n.message}</p>
                          <span className="text-[10px] text-gray-500">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-900/40 rounded-xl transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0)}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl p-2 shadow-xl z-30">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[10px] text-gray-400">{user?.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all mt-1"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLL */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
