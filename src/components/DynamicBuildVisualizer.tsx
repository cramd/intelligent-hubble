'use client';

import { motion } from 'framer-motion';

export function DynamicBuildVisualizer({ rating }: { rating: number }) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating || 1)));

  // SVG for an isometric LEGO brick
  const BrickSVG = ({ colorClass }: { colorClass: string }) => (
    <svg viewBox="0 0 100 60" className={`w-16 h-12 md:w-20 md:h-14 drop-shadow-xl ${colorClass}`}>
      {/* Side left */}
      <path d="M50 60 L10 40 L10 20 L50 40 Z" fill="currentColor" className="brightness-75" />
      {/* Side right */}
      <path d="M50 60 L90 40 L90 20 L50 40 Z" fill="currentColor" className="brightness-50" />
      {/* Top */}
      <path d="M50 40 L10 20 L50 0 L90 20 Z" fill="currentColor" />
      
      {/* Studs */}
      <ellipse cx="35" cy="15" rx="6" ry="3" fill="currentColor" className="brightness-110" />
      <path d="M29 15 L29 12 C29 10.3 31.7 9 35 9 C38.3 9 41 10.3 41 12 L41 15 Z" fill="currentColor" className="brightness-125" />
      
      <ellipse cx="65" cy="15" rx="6" ry="3" fill="currentColor" className="brightness-110" />
      <path d="M59 15 L59 12 C59 10.3 61.7 9 65 9 C68.3 9 71 10.3 71 12 L71 15 Z" fill="currentColor" className="brightness-125" />
      
      <ellipse cx="50" cy="22" rx="6" ry="3" fill="currentColor" className="brightness-110" />
      <path d="M44 22 L44 19 C44 17.3 46.7 16 50 16 C53.3 16 56 17.3 56 19 L56 22 Z" fill="currentColor" className="brightness-125" />
    </svg>
  );

  const colors = [
    'text-red-500',     // 1
    'text-yellow-500',  // 2
    'text-green-500',   // 3
    'text-blue-500',    // 4
    'text-purple-500'   // 5
  ];

  return (
    <div className="relative w-full h-48 flex items-end justify-center mb-4">
      {Array.from({ length: safeRating }).map((_, i) => {
        // Calculate stacking offset
        // Each brick is 60px high viewBox, but overlaps by about 20px visually in isometric projection
        const yOffset = i * -15; 
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: yOffset }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15, 
              delay: i * 0.15 
            }}
            className="absolute"
            style={{ zIndex: 10 - i }}
          >
            <BrickSVG colorClass={colors[i]} />
          </motion.div>
        );
      })}
    </div>
  );
}
