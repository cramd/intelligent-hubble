'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UserSet } from '@/lib/rebrickable';
import { X, ExternalLink, TrendingUp, DollarSign, Save, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { DynamicBuildVisualizer } from './DynamicBuildVisualizer';

interface SetMetadata {
  savedPrice?: number;
  note?: string;
  ratings?: {
    price: number;
    buildFun: number;
    overall: number;
    value: number;
  };
}

interface SetDetailModalProps {
  item: UserSet | null;
  onClose: () => void;
}

export function SetDetailModal({ item, onClose }: SetDetailModalProps) {
  const [pricing, setPricing] = useState<{ msrp: number; currentValue: number } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  const [metadata, setMetadata] = useState<SetMetadata>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Reset and fetch when item changes
  useEffect(() => {
    setPricing(null);
    setMetadata({});
    setSaveStatus(null);
    if (item) {
      fetchMetadata(item.set.set_num);
    }
  }, [item]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchMetadata = async (setNum: string) => {
    setLoadingMetadata(true);
    try {
      const res = await fetch(`/api/set-metadata/${setNum}`);
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
        if (data.savedPrice || data.savedMsrp) {
          // If we have a saved price or msrp, show it immediately without re-fetching
          setPricing({ msrp: data.savedMsrp || 0, currentValue: data.savedPrice || 0 });
        }
      }
    } catch (e) {
      console.error('Error fetching metadata', e);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const saveMetadata = async (updates: Partial<SetMetadata>) => {
    if (!item) return;
    setSavingMetadata(true);
    setSaveStatus('Saving...');
    try {
      const updatedMetadata = { ...metadata, ...updates };
      setMetadata(updatedMetadata);
      
      const res = await fetch(`/api/set-metadata/${item.set.set_num}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus('Error saving');
      }
    } catch (e) {
      console.error('Error saving metadata', e);
      setSaveStatus('Error saving');
    } finally {
      setSavingMetadata(false);
    }
  };

  const handleCheckValue = async () => {
    if (!item) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`/api/value/${item.set.set_num}?parts=${item.set.num_parts}&year=${item.set.year}`);
      const data = await res.json();
      setPricing(data);
      // Auto-save the fetched value to metadata
      if (data.currentValue || data.msrp !== undefined) {
        await saveMetadata({ savedPrice: data.currentValue, savedMsrp: data.msrp });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrice(false);
    }
  };

  const updateRating = (category: keyof NonNullable<SetMetadata['ratings']>, value: number) => {
    const currentRatings = metadata.ratings || { price: 0, buildFun: 0, overall: 0, value: 0 };
    saveMetadata({
      ratings: { ...currentRatings, [category]: value }
    });
  };

  const updateNote = (note: string) => {
    setMetadata(prev => ({ ...prev, note }));
  };

  const handleNoteBlur = () => {
    saveMetadata({ note: metadata.note });
  };

  // Helper to render the 5 bricks for rating
  const renderRatingBricks = (category: keyof NonNullable<SetMetadata['ratings']>, label: string) => {
    const currentVal = metadata.ratings?.[category] || 0;
    return (
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/70 text-sm font-medium">{label}</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(val => (
            <button
              key={val}
              onClick={() => updateRating(category, val)}
              className={`w-6 h-4 md:w-8 md:h-5 rounded-sm border transition-all ${
                val <= currentVal 
                  ? 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]' 
                  : 'bg-white/5 border-white/20 hover:bg-white/20'
              }`}
              style={{
                clipPath: 'polygon(0% 20%, 20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%)'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              layoutId={`card-${item.set.set_num}`}
              className="pointer-events-auto relative w-full max-w-6xl overflow-hidden rounded-3xl bg-[#0f172a] shadow-2xl backdrop-blur-xl border border-white/10"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full max-h-[90vh] overflow-y-auto lg:overflow-hidden">
                {/* Left Column: Image and Dynamic Build */}
                <div className="bg-black/40 p-8 flex flex-col items-center justify-center min-h-[400px] border-r border-white/5 lg:col-span-1">
                  {item.set.set_img_url ? (
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      src={item.set.set_img_url}
                      alt={item.set.name}
                      className="w-full h-auto max-h-[40vh] object-contain drop-shadow-2xl mb-8"
                    />
                  ) : (
                    <div className="text-white/30 mb-8">Image not available</div>
                  )}

                  {/* Dynamic Build Visualizer based on Overall Rating */}
                  <div className="w-full flex flex-col items-center justify-end h-48 mt-4 bg-gradient-to-t from-blue-900/20 to-transparent rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                    <p className="absolute top-3 left-4 text-xs font-bold text-white/50 uppercase tracking-widest">
                      Overall Rating
                    </p>
                    <DynamicBuildVisualizer rating={metadata.ratings?.overall || 0} />
                  </div>
                </div>

                {/* Right Columns: Details, Ratings, Notes */}
                <div className="p-8 lg:p-12 lg:col-span-2 overflow-y-auto">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-medium">
                        Set {item.set.set_num}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium">
                        {item.set.year}
                      </span>
                    </div>
                    
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-8 leading-tight tracking-tight drop-shadow-sm">
                      {item.set.name}
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <p className="text-sm text-white/50 mb-1">Pieces</p>
                        <p className="text-2xl font-bold text-white">{item.set.num_parts}</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <p className="text-sm text-white/50 mb-1">Owned</p>
                        <p className="text-2xl font-bold text-white">{item.quantity}x</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      {/* Pricing Section */}
                      <div className="bg-black/30 rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                          <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                          Market Value
                        </h3>
                        {!pricing && !metadata.savedPrice ? (
                          <div className="flex flex-col items-center justify-center text-center py-4">
                            <p className="text-white/40 text-sm mb-4">Check live market data to save portfolio value.</p>
                            <button
                              onClick={handleCheckValue}
                              disabled={loadingPrice}
                              className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-70"
                            >
                              {loadingPrice ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                'Check Current Value'
                              )}
                            </button>
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col space-y-4"
                          >
                            <div className="flex justify-between items-end bg-white/5 p-4 rounded-2xl">
                              <div>
                                <p className="text-xs text-white/50 mb-1 font-medium uppercase tracking-wider">Estimated Value</p>
                                <p className="text-3xl font-black text-green-400 drop-shadow-sm">
                                  ${(pricing?.currentValue || metadata.savedPrice || 0).toFixed(2)}
                                </p>
                              </div>
                              <TrendingUp className="w-8 h-8 text-green-500/50 mb-1" />
                            </div>
                            
                            <button
                              onClick={handleCheckValue}
                              disabled={loadingPrice}
                              className="text-xs text-white/40 hover:text-white/80 transition-colors flex items-center justify-center"
                            >
                              {loadingPrice ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : 'Refresh live value'}
                            </button>
                          </motion.div>
                        )}
                      </div>

                      {/* Ratings Section */}
                      <div className="bg-black/30 rounded-3xl p-6 border border-white/10 shadow-xl relative">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-white">Your Rating</h3>
                          {saveStatus && (
                            <span className="text-xs text-blue-400 animate-pulse flex items-center">
                              {saveStatus === 'Saving...' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                              {saveStatus}
                            </span>
                          )}
                        </div>
                        
                        {loadingMetadata ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {renderRatingBricks('price', 'Price / Cost')}
                            {renderRatingBricks('buildFun', 'Build Experience')}
                            {renderRatingBricks('value', 'Display Value')}
                            <div className="pt-2 mt-2 border-t border-white/10">
                              {renderRatingBricks('overall', 'Overall Rating')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-black/30 rounded-3xl p-6 border border-white/10 shadow-xl mb-8 relative group">
                      <h3 className="text-lg font-bold text-white mb-3">Personal Note</h3>
                      <textarea 
                        value={metadata.note || ''}
                        onChange={(e) => updateNote(e.target.value)}
                        onBlur={handleNoteBlur}
                        placeholder="Add a note about this set (e.g., 'Missing a few pieces', 'Built with my son in 2024')..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none min-h-[120px]"
                      />
                    </div>

                    <a
                      href={item.set.set_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold hover:border-white/20 transition-all"
                    >
                      View on Rebrickable
                      <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
                    </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
