import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowLeft, Star, Zap } from 'lucide-react';
import { GameItem, UserProfile } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { playSound } from '../lib/sound';

interface ShopProps {
  profile: UserProfile;
  onClose: () => void;
  onPurchase: (item: GameItem) => void;
}

export const Shop: React.FC<ShopProps> = ({ profile, onClose, onPurchase }) => {
  const getRarityColor = (rarity: GameItem['rarity']) => {
    switch (rarity) {
      case 'COMMON': return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10';
      case 'RARE': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      case 'EPIC': return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
      case 'LEGENDARY': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
      default: return 'text-zinc-400';
    }
  };

  const isOwned = (itemId: string) => {
    return profile.inventory?.items.includes(itemId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl h-[85vh] bg-zinc-900 rounded-[32px] border border-white/10 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-bottom border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { playSound('click'); onClose(); }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Gyuuun Store</h2>
              <p className="text-zinc-500 text-sm font-medium tracking-wide">Premium Cosmetics & Gear</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-yellow-500/10 px-6 py-3 rounded-2xl border border-yellow-500/20">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
              <Star size={16} className="text-zinc-900 fill-zinc-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest">Balance</span>
              <span className="text-xl font-black text-yellow-400 leading-none">{profile.goldenCarrots?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Categories / Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {SHOP_ITEMS.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -5 }}
                className={`group relative bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden flex flex-col transition-all hover:border-white/20`}
              >
                <div className="aspect-square bg-zinc-900 relative p-6 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{item.category}</span>
                  <h3 className="text-lg font-black text-white leading-tight mb-2 tracking-tight">{item.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6 flex-1">{item.description}</p>

                  <button
                    disabled={isOwned(item.id) || profile.goldenCarrots < item.price}
                    onClick={() => {
                      playSound('purchase');
                      onPurchase(item);
                    }}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                      isOwned(item.id) 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : profile.goldenCarrots >= item.price
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {isOwned(item.id) ? (
                      'Owned'
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        {item.price} Carrots
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
