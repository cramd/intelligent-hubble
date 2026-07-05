'use client';

import { motion } from 'framer-motion';

interface UserStatsProps {
  totalSets: number;
  totalParts: number;
  uniqueThemes: number;
}

// A helper component to render the "studs" on top of the Lego brick
const LegoStuds = ({ colorClass }: { colorClass: string }) => (
  <div className="absolute -top-3 left-0 right-0 flex justify-around px-4">
    {[...Array(4)].map((_, i) => (
      <div 
        key={i} 
        className={`w-10 h-3 rounded-t-sm ${colorClass} border-t border-x border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]`} 
      />
    ))}
  </div>
);

export function UserStats({ totalSets, totalParts, uniqueThemes }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-12 px-4 max-w-5xl mx-auto mt-4">
      
      {/* Brick 1: Total Sets (Lego Red) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative bg-red-600 rounded-lg p-6 text-center border-b-4 border-r-4 border-red-800 shadow-xl"
      >
        <LegoStuds colorClass="bg-red-600" />
        <h3 className="text-red-200 text-sm font-bold uppercase tracking-wider mb-1">Total Sets</h3>
        <p className="text-4xl font-extrabold text-white drop-shadow-md">{totalSets}</p>
      </motion.div>

      {/* Brick 2: Total Parts (Lego Yellow) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative bg-yellow-500 rounded-lg p-6 text-center border-b-4 border-r-4 border-yellow-700 shadow-xl"
      >
        <LegoStuds colorClass="bg-yellow-500" />
        <h3 className="text-yellow-800 text-sm font-bold uppercase tracking-wider mb-1">Total Parts</h3>
        <p className="text-4xl font-extrabold text-white drop-shadow-md">{totalParts.toLocaleString()}</p>
      </motion.div>

      {/* Brick 3: Unique Themes (Lego Blue) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative bg-blue-600 rounded-lg p-6 text-center border-b-4 border-r-4 border-blue-800 shadow-xl"
      >
        <LegoStuds colorClass="bg-blue-600" />
        <h3 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Unique Themes</h3>
        <p className="text-4xl font-extrabold text-white drop-shadow-md">{uniqueThemes}</p>
      </motion.div>

    </div>
  );
}
