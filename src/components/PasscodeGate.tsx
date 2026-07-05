'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

export function PasscodeGate() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Access denied');
      }

      // Reload the page to let the Server Component recognize the auth cookie
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/50 via-transparent to-[#0f172a]/80" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center"
      >
        <div className="mx-auto w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
          Restricted Engine
        </h1>
        <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">
          The Recommendation Engine is currently locked to prevent public token consumption. Enter the passcode to access it.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 text-left">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5 pl-1">Passcode</label>
            <div className="relative">
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors tracking-widest text-center placeholder:tracking-normal"
                autoFocus
              />
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs flex items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20"
            >
              <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Unlock Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
