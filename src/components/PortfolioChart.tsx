'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Loader2, DollarSign } from 'lucide-react';
import { SetMetadata } from '@/app/api/set-metadata/[set_num]/route';

interface PortfolioData {
  totalValue: number;
  items: Record<string, SetMetadata>;
}

export function PortfolioChart() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch portfolio', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center justify-center h-64 shadow-2xl mb-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-white/50 text-sm font-medium">Loading portfolio data...</p>
      </div>
    );
  }

  if (!data || data.totalValue === 0) {
    return (
      <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center justify-center h-64 shadow-2xl mb-8 text-center">
        <DollarSign className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Portfolio Data</h3>
        <p className="text-white/50 text-sm max-w-sm">
          Click on your sets and use the "Check Current Value" button to start building your portfolio history!
        </p>
      </div>
    );
  }

  // Transform data for chart: Top 5 sets by value
  const chartData = Object.entries(data.items)
    .filter(([_, meta]) => meta.savedPrice && meta.savedPrice > 0)
    .map(([setNum, meta]) => ({
      name: `Set ${setNum}`,
      value: meta.savedPrice || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl mb-12 flex flex-col md:flex-row gap-8 items-center"
    >
      <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
        <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full mb-6 border border-green-500/30">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Live Portfolio</span>
        </div>
        <p className="text-white/50 text-sm mb-2 font-medium">Total Estimated Value</p>
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-sm mb-4">
          ${data.totalValue.toFixed(2)}
        </h2>
        <p className="text-white/40 text-xs max-w-xs mx-auto md:mx-0">
          Based on the saved market values of your highest appreciating sets.
        </p>
      </div>

      <div className="flex-[2] w-full h-64">
        <h3 className="text-white/70 text-sm font-semibold mb-4 text-center md:text-left">Top Valuable Sets</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
              itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
