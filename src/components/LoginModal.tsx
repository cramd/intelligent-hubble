'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeySquare } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      // Success! Reload the page so the server components fetch data with the new cookie
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <KeySquare className="w-6 h-6 mr-3 text-blue-400" />
                    Connect Account
                  </h2>
                  <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-white/60 text-sm mb-6">
                  Log in with your Rebrickable username and password. We will securely request a User Token and store it in an encrypted cookie so you can sync your collection.
                </p>

                <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Secure Login'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
