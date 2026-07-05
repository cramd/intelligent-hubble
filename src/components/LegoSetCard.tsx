'use client';

import { motion } from 'framer-motion';
import { LegoSet, UserSet } from '@/lib/rebrickable';
import { Edit2, Check, X, Trash2, Star } from 'lucide-react';
import { useState } from 'react';

interface LegoSetCardProps {
  item: UserSet;
  rating?: number;
  onClick: () => void;
  onUpdate: (oldSetNum: string, newSetData: UserSet) => void;
  onDelete: () => void;
}

export function LegoSetCard({ item, rating, onClick, onUpdate, onDelete }: LegoSetCardProps) {
  const { set, quantity } = item;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(set.set_num.replace('-1', ''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editValue.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/set/${editValue}`);
      if (!res.ok) throw new Error('Set not found');
      
      const newSetDetails: LegoSet = await res.json();
      onUpdate(set.set_num, { ...item, set: newSetDetails });
      setIsEditing(false);
    } catch (err) {
      setError('Invalid set number');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl border border-white/20 h-full flex flex-col justify-center items-center">
        <h4 className="text-white font-bold mb-4">Edit Set Number</h4>
        <form onSubmit={handleEditSubmit} className="w-full flex flex-col space-y-3">
          <input 
            type="text" 
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="e.g. 10302"
            className="w-full bg-black/40 text-white rounded-lg px-4 py-2 outline-none border border-white/10 focus:border-blue-500 transition-colors"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex space-x-2 w-full">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex justify-center items-center"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex justify-center items-center disabled:opacity-50"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <motion.div
      layoutId={`card-${set.set_num}`}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md border border-white/20 transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:bg-white/15 cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="p-2 bg-black/40 hover:bg-blue-600 rounded-full text-white/50 hover:text-white transition-colors"
          title="Edit Set"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 bg-black/40 hover:bg-red-600 rounded-full text-white/50 hover:text-white transition-colors"
          title="Remove Set"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/5 mb-4 relative flex items-center justify-center">
        {set.set_img_url ? (
          <img 
            src={set.set_img_url} 
            alt={set.name} 
            className="object-contain w-full h-full p-4 drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="text-white/40 font-medium">No Image</div>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold text-white/90 truncate text-lg" title={set.name}>
          {set.name}
        </h3>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
            {set.set_num}
          </span>
          <span className="text-sm text-white/60 font-medium">
            {set.year}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-white/50">{set.num_parts} parts</span>
            {!!rating && rating > 0 && (
              <span className="flex items-center text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                {rating}/5
              </span>
            )}
          </div>
          {quantity > 1 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
              x{quantity}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
