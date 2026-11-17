import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'Admin') {
      setEmail('admin@gridsense.com');
      setPassword('adminpassword');
    } else {
      setEmail('operator@gridsense.com');
      setPassword('operatorpassword');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] px-4 relative overflow-hidden">
      {/* Visual glowing background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-card rounded-2xl p-8 z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-4 border border-blue-500/30">
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">GridSense AI</h1>
          <p className="text-gray-400 text-sm">Electrical Distribution Fault Localization Engine</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="operator@gridsense.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0B1220] px-3 text-gray-500 font-semibold tracking-wider">Demo Quick Access</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => fillDemo('Operator')}
            className="flex items-center justify-center gap-2 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800 text-gray-300 py-2.5 px-4 rounded-xl text-sm transition-all"
          >
            <Shield className="h-4 w-4 text-amber-500" />
            Demo Operator
          </button>
          <button
            type="button"
            onClick={() => fillDemo('Admin')}
            className="flex items-center justify-center gap-2 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800 text-gray-300 py-2.5 px-4 rounded-xl text-sm transition-all"
          >
            <Shield className="h-4 w-4 text-emerald-500" />
            Demo Admin
          </button>
        </div>
      </motion.div>
    </div>
  );
}
