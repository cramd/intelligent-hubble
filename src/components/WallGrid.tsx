'use client';

import { useState, useMemo, useEffect } from 'react';
import { LegoSetCard } from './LegoSetCard';
import { SetDetailModal } from './SetDetailModal';
import { UserStats } from './UserStats';
import { AddSetModal } from './AddSetModal';
import { UserSet } from '@/lib/rebrickable';
import { motion } from 'framer-motion';
import { CloudUpload, Plus, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PortfolioChart, PortfolioData } from './PortfolioChart';
import { SetMetadata } from '@/app/api/set-metadata/[set_num]/route';

interface WallGridProps {
  collection: UserSet[];
}

type SortOption = 'default' | 'year' | 'pieces' | 'theme' | 'top-rated';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export function WallGrid({ collection: initialCollection }: WallGridProps) {
  const [localCollection, setLocalCollection] = useState<UserSet[]>(initialCollection);
  const [selectedItem, setSelectedItem] = useState<UserSet | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  
  // Sync State
  const [pendingAdditions, setPendingAdditions] = useState<UserSet[]>([]);
  const [pendingModifications, setPendingModifications] = useState<UserSet[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const hasPendingChanges = pendingAdditions.length > 0 || pendingModifications.length > 0 || pendingDeletions.length > 0;

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      }
    } catch (e) {
      console.error('Failed to fetch collection metadata', e);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Compute Stats
  const stats = useMemo(() => {
    let parts = 0;
    const themes = new Set<number>();
    localCollection.forEach(item => {
      parts += item.set.num_parts * item.quantity;
      themes.add(item.set.theme_id);
    });
    return {
      totalSets: localCollection.reduce((acc, curr) => acc + curr.quantity, 0),
      totalParts: parts,
      uniqueThemes: themes.size
    };
  }, [localCollection]);

  const handleAddSet = (newSet: UserSet) => {
    setLocalCollection(prev => [newSet, ...prev]);
    setPendingAdditions(prev => [...prev, newSet]);
  };

  const handleUpdateSet = (oldSetNum: string, newSetData: UserSet) => {
    setLocalCollection(prev => 
      prev.map(item => item.set.set_num === oldSetNum ? newSetData : item)
    );
    // If the set was just added, update the addition instead of adding to modifications
    const isNewAddition = pendingAdditions.some(s => s.set.set_num === oldSetNum);
    if (isNewAddition) {
      setPendingAdditions(prev => prev.map(item => item.set.set_num === oldSetNum ? newSetData : item));
    } else {
      setPendingModifications(prev => {
        const existing = prev.find(item => item.set.set_num === oldSetNum);
        if (existing) return prev.map(item => item.set.set_num === oldSetNum ? newSetData : item);
        return [...prev, newSetData];
      });
    }
  };

  const handleDeleteSet = (setNum: string) => {
    setLocalCollection(prev => prev.filter(item => item.set.set_num !== setNum));
    
    // If it was pending addition, just remove it from pending additions
    if (pendingAdditions.some(s => s.set.set_num === setNum)) {
      setPendingAdditions(prev => prev.filter(s => s.set.set_num !== setNum));
    } else {
      setPendingDeletions(prev => [...prev, setNum]);
    }
  };

  const handleSync = async () => {
    if (!hasPendingChanges) return;
    setIsSyncing(true);
    setSyncError('');

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additions: pendingAdditions.map(s => ({ set_num: s.set.set_num, quantity: s.quantity })),
          modifications: pendingModifications.map(s => ({ set_num: s.set.set_num, quantity: s.quantity })),
          deletions: pendingDeletions
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync');
      }

      // Sync successful!
      setPendingAdditions([]);
      setPendingModifications([]);
      setPendingDeletions([]);
      
      // Force a full page reload to fetch the new fresh state from Rebrickable
      window.location.reload();
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const sortedCollection = useMemo(() => {
    const arr = [...localCollection];
    if (sortBy === 'year') {
      arr.sort((a, b) => b.set.year - a.set.year);
    } else if (sortBy === 'pieces') {
      arr.sort((a, b) => b.set.num_parts - a.set.num_parts);
    } else if (sortBy === 'theme') {
      arr.sort((a, b) => a.set.theme_id - b.set.theme_id);
    } else if (sortBy === 'top-rated') {
      arr.sort((a, b) => {
        const items = portfolioData?.items || {};
        const aRating = items[a.set.set_num]?.ratings?.overall || 0;
        const bRating = items[b.set.set_num]?.ratings?.overall || 0;
        return bRating - aRating;
      });
    }
    return arr;
  }, [localCollection, sortBy, portfolioData]);

  // When modal closes, refresh metadata quietly so Top Rated sort applies and Portfolio chart updates
  const handleModalClose = async () => {
    setSelectedItem(null);
    fetchPortfolio();
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <PortfolioChart data={portfolioData} loading={loadingPortfolio} />
      </div>

      <UserStats {...stats} />

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        
        {/* Sync Controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Set
          </button>
          
          <button 
            onClick={handleSync}
            disabled={!hasPendingChanges || isSyncing}
            className={`flex items-center px-4 py-2 rounded-xl border transition-all font-medium text-sm ${
              hasPendingChanges 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                : 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <div className="w-4 h-4 mr-2 border-2 border-black/50 border-t-black rounded-full animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4 mr-2" />
            )}
            {hasPendingChanges ? 'Sync to Cloud' : 'Cloud Synced'}
          </button>

          {syncError && (
            <span className="text-red-400 text-xs flex items-center bg-red-500/10 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3 mr-1" /> {syncError}
            </span>
          )}

          <Link 
            href="/recommendations"
            className="flex items-center bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-purple-400 animate-pulse" /> Suggestions
          </Link>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
          <span className="text-white/60 text-sm font-medium">Sort By:</span>
          <select 
            className="bg-transparent text-white font-medium outline-none cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="default" className="text-black">Default</option>
            <option value="year" className="text-black">Date Released (Newest)</option>
            <option value="pieces" className="text-black">Cost / Pieces (High to Low)</option>
            <option value="theme" className="text-black">Theme Group</option>
            <option value="top-rated" className="text-black text-blue-600 font-bold">Top Rated</option>
          </select>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 px-4 md:px-8 pb-12 max-w-[1600px] mx-auto"
      >
        {sortedCollection.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-bold text-white mb-2">No Sets Found</h2>
            <p className="text-white/60">Add some sets to get started.</p>
          </div>
        ) : (
          sortedCollection.map((item) => {
            const isPending = pendingAdditions.some(s => s.set.set_num === item.set.set_num) || 
                              pendingModifications.some(s => s.set.set_num === item.set.set_num);
            return (
              <motion.div 
                key={item.set.set_num} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={isPending ? "ring-2 ring-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" : ""}
              >
                <LegoSetCard 
                  item={item} 
                  rating={portfolioData?.items?.[item.set.set_num]?.ratings?.overall || 0}
                  onClick={() => setSelectedItem(item)} 
                  onUpdate={handleUpdateSet}
                  onDelete={() => handleDeleteSet(item.set.set_num)}
                />
              </motion.div>
            );
          })
        )}
      </motion.div>

      <SetDetailModal 
        item={selectedItem} 
        onClose={handleModalClose} 
      />

      <AddSetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddSet}
      />
    </>
  );
}
