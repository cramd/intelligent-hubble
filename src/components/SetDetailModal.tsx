'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UserSet } from '@/lib/rebrickable';
import { X, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SetDetailModalProps {
  item: UserSet | null;
  onClose: () => void;
}

export function SetDetailModal({ item, onClose }: SetDetailModalProps) {
  const [pricing, setPricing] = useState<{ msrp: number; currentValue: number } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Reset pricing state when modal changes
  useEffect(() => {
    setPricing(null);
  }, [item]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCheckValue = async () => {
    if (!item) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`/api/value/${item.set.set_num}?parts=${item.set.num_parts}&year=${item.set.year}`);
      const data = await res.json();
      setPricing(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrice(false);
    }
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              layoutId={`card-${item.set.set_num}`}
              className="pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-3xl bg-gray-900/80 shadow-2xl backdrop-blur-xl border border-white/10"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full max-h-[85vh] overflow-y-auto md:overflow-hidden">
                <div className="bg-black/40 p-8 flex items-center justify-center min-h-[300px]">
                  {item.set.set_img_url ? (
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      src={item.set.set_img_url}
                      alt={item.set.name}
                      className="w-full h-auto max-h-[60vh] object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="text-white/30">Image not available</div>
                  )}
                </div>

                <div className="p-8 md:p-12 flex flex-col justify-center">
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
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                      {item.set.name}
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-sm text-white/50 mb-1">Pieces</p>
                        <p className="text-2xl font-semibold text-white">{item.set.num_parts}</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <p className="text-sm text-white/50 mb-1">Owned</p>
                        <p className="text-2xl font-semibold text-white">{item.quantity}x</p>
                      </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 mb-8">
                      {!pricing ? (
                        <div className="flex flex-col items-center justify-center text-center">
                          <p className="text-white/60 text-sm mb-4">Market data is dynamically generated.</p>
                          <button
                            onClick={handleCheckValue}
                            disabled={loadingPrice}
                            className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg disabled:opacity-70"
                          >
                            {loadingPrice ? (
                              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Check Current Value
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-between items-end"
                        >
                          <div>
                            <p className="text-sm text-white/50 mb-1">Original MSRP</p>
                            <p className="text-xl font-medium text-white/80">${pricing.msrp.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-400 mb-1 flex items-center justify-end">
                              <TrendingUp className="w-3 h-3 mr-1" /> Estimated Value
                            </p>
                            <p className="text-3xl font-bold text-green-400">${pricing.currentValue.toFixed(2)}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <a
                      href={item.set.set_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full px-6 py-4 rounded-xl bg-white/10 text-white border border-white/20 font-semibold hover:bg-white/20 transition-colors"
                    >
                      View on Rebrickable
                      <ExternalLink className="w-4 h-4 ml-2" />
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
