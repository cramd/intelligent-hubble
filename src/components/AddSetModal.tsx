'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus } from 'lucide-react';
import { LegoSet, UserSet } from '@/lib/rebrickable';

interface AddSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (set: UserSet) => void;
}

export function AddSetModal({ isOpen, onClose, onAdd }: AddSetModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewSet, setPreviewSet] = useState<LegoSet | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setPreviewSet(null);
      setError('');
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setPreviewSet(null);

    try {
      const res = await fetch(`/api/set/${searchQuery}`);
      if (!res.ok) throw new Error('Set not found');
      const data = await res.json();
      setPreviewSet(data);
    } catch (err) {
      setError('Could not find a set with that number. Did you include the -1 suffix? (e.g. 10302-1)');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!previewSet) return;
    const newUserSet: UserSet = {
      list_id: 0, // Mock list ID
      quantity: 1,
      include_spares: false,
      set: previewSet
    };
    onAdd(newUserSet);
    onClose();
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
              className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Add Set to Collection</h2>
                  <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSearch} className="flex space-x-3 mb-6">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Set Number (e.g., 40803)"
                    className="flex-1 bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  />
                  <button 
                    type="submit" 
                    disabled={loading || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center disabled:opacity-50 transition-colors"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </form>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                {previewSet && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center"
                  >
                    {previewSet.set_img_url ? (
                      <img src={previewSet.set_img_url} alt={previewSet.name} className="h-40 object-contain drop-shadow-lg mb-4" />
                    ) : (
                      <div className="h-40 w-full flex items-center justify-center bg-black/20 rounded-lg mb-4">No Image</div>
                    )}
                    <h3 className="text-lg font-bold text-white mb-1">{previewSet.name}</h3>
                    <p className="text-white/50 text-sm mb-6">{previewSet.set_num} • {previewSet.num_parts} parts</p>
                    
                    <button 
                      onClick={handleAdd}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add to Collection
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
