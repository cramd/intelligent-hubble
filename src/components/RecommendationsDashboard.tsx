'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LegoSet } from '@/lib/rebrickable';
import { ArrowLeft, Sparkles, FolderHeart, Plus, Check, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ThemeAffinity {
  id: number;
  name: string;
  count: number;
}

interface RecommendationGroup {
  themeId: number;
  themeName: string;
  reason: string;
  sets: LegoSet[];
}

export function RecommendationsDashboard() {
  const [data, setData] = useState<{ recommendations: RecommendationGroup[]; themeAffinity: ThemeAffinity[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingSetNum, setAddingSetNum] = useState<string | null>(null);
  const [addedSets, setAddedSets] = useState<Set<string>>(new Set());

  const fetchRecommendations = async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/recommendations');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch recommendations');
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAddRecommendedSet = async (setNum: string) => {
    setAddingSetNum(setNum);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additions: [{ set_num: setNum, quantity: 1 }]
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add set');
      }

      setAddedSets(prev => {
        const next = new Set(prev);
        next.add(setNum);
        return next;
      });
    } catch (err: any) {
      alert(`Error adding set: ${err.message}`);
    } finally {
      setAddingSetNum(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-white/60 font-medium animate-pulse">Building your personalized shelf recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 max-w-md backdrop-blur-xl">
          <h2 className="text-xl font-bold text-red-400 mb-4">Failed to Load recommendations</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/"
              className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
            </Link>
            <button 
              onClick={() => fetchRecommendations()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasRecommendations = data && data.recommendations.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] relative overflow-hidden pb-20">
      {/* Background Graphic */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a]">
        <img 
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 blur-md scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/70 via-[#0f172a]/40 to-[#0f172a]/90" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      </div>

      <div className="relative z-10 container mx-auto pt-16 px-4 md:px-8 max-w-6xl">
        {/* Navigation / Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <Link 
            href="/"
            className="group flex items-center bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 px-4 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Showcase
          </Link>
          <div className="flex items-center space-x-2 text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
            AI Suggestion Engine Active
          </div>
        </div>

        {/* Hero Section */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Brick Suggestions
          </h1>
          <p className="text-white/60 font-medium max-w-xl">
            Tailored suggestions to expand your collections, complete your favorite themes, and discover new models.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Theme Affinity Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center mb-6">
                <FolderHeart className="w-5 h-5 mr-2 text-pink-400" />
                Theme Affinity
              </h2>
              <p className="text-white/50 text-xs mb-6">
                Based on the distribution of themes in your current showcase.
              </p>
              
              <div className="space-y-5">
                {data?.themeAffinity.map((theme, index) => {
                  const maxCount = data.themeAffinity[0]?.count || 1;
                  const percent = (theme.count / maxCount) * 100;
                  // Color cycle for bars (Lego Red, Yellow, Blue, Green, Purple)
                  const barColors = [
                    'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                    'bg-yellow-500 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
                    'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
                    'bg-green-500 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
                    'bg-purple-500 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  ];
                  const barColor = barColors[index % barColors.length];

                  return (
                    <div key={theme.id} className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-white/80 truncate max-w-[150px]">{theme.name}</span>
                        <span className="text-white/40">{theme.count} sets</span>
                      </div>
                      <div className="h-4 bg-black/40 rounded-lg overflow-hidden border border-white/5 p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-full rounded-md border-t ${barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
                {data?.themeAffinity.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-6">Log in to display theme counts.</p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations Content */}
          <div className="lg:col-span-2 space-y-10">
            {hasRecommendations ? (
              data.recommendations.map((group) => (
                <div key={group.themeId} className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-xl font-bold text-white mb-1">{group.themeName} Suggestions</h3>
                    <p className="text-white/40 text-xs font-medium">{group.reason}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {group.sets.map((set) => {
                      const isAdded = addedSets.has(set.set_num);
                      const isAdding = addingSetNum === set.set_num;

                      return (
                        <div 
                          key={set.set_num}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="aspect-square w-full bg-black/20 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center p-4">
                              {set.set_img_url ? (
                                <img 
                                  src={set.set_img_url} 
                                  alt={set.name}
                                  className="object-contain w-full h-full drop-shadow-xl"
                                />
                              ) : (
                                <div className="text-white/30 text-sm font-semibold">No Image</div>
                              )}
                            </div>
                            <h4 className="font-bold text-white text-base truncate mb-1" title={set.name}>
                              {set.name}
                            </h4>
                            <div className="flex justify-between items-center text-xs text-white/50 mb-4">
                              <span>Set {set.set_num}</span>
                              <span>{set.num_parts} parts</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddRecommendedSet(set.set_num)}
                            disabled={isAdded || isAdding}
                            className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                              isAdded 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50'
                            }`}
                          >
                            {isAdding ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isAdded ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Added to Showcase
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add to Collection
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
                <p className="text-white/60 text-lg font-semibold">No recommendations found</p>
                <p className="text-white/40 text-sm mt-2">Try adding more sets to your collection first to build theme suggestions!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
