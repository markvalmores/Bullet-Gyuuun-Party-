import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Star, Ghost, Package } from 'lucide-react';
import { GachaBanner, GameItem, UserProfile } from '../types';
import { GACHA_BANNERS } from '../data/items';

interface GachaProps {
  profile: UserProfile;
  onClose: () => void;
  onRoll: (banner: GachaBanner) => Promise<GameItem | null>;
}

export const Gacha: React.FC<GachaProps> = ({ profile, onClose, onRoll }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<GameItem | null>(null);

  const handleRoll = async (banner: GachaBanner) => {
    if (profile.goldenCarrots < banner.cost) return;
    
    setIsRolling(true);
    setResult(null);
    
    // Simulate animation delay
    const item = await onRoll(banner);
    
    setTimeout(() => {
      setResult(item);
      setIsRolling(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
      <AnimatePresence>
        {!result ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-4xl bg-zinc-900 rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <div className="flex items-center gap-6">
                <button 
                  onClick={onClose}
                  className="p-4 bg-black/40 hover:bg-black/60 rounded-full transition-all border border-white/5"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                    Gyuuun Gacha <Sparkles className="text-yellow-400" />
                  </h2>
                  <p className="text-zinc-400 font-medium tracking-wide">Test your luck at the altar!</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 px-8 py-4 rounded-3xl border border-white/10 shadow-inner">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <Star size={20} className="text-zinc-900 fill-zinc-900" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest">Available</span>
                  <span className="text-2xl font-black text-yellow-400 leading-none">{profile.goldenCarrots?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Banners */}
            <div className="flex-1 p-10 overflow-y-auto">
              {GACHA_BANNERS.map(banner => (
                <div key={banner.id} className="relative group rounded-[32px] overflow-hidden border border-white/10 bg-zinc-950">
                  <img src={banner.image} alt={banner.name} className="w-full h-[300px] object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent p-10 flex flex-col justify-end">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-red-600/40">Limited Banner</span>
                      <span className="px-4 py-1.5 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10 backdrop-blur-md">Ends in 24 Days</span>
                    </div>
                    <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">{banner.name}</h3>
                    <div className="flex items-center gap-8 mb-8">
                      <div className="flex items-center gap-3">
                        <Ghost className="text-purple-400" size={20} />
                        <span className="text-zinc-300 font-bold tracking-tight">Drop Rate: <span className="text-purple-400">{banner.rate}%</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package className="text-blue-400" size={20} />
                        <span className="text-zinc-300 font-bold tracking-tight">Guaranteed in 80 Pulls</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        disabled={isRolling || profile.goldenCarrots < banner.cost}
                        onClick={() => handleRoll(banner)}
                        className="flex-1 py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-3xl font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        {isRolling ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <Sparkles size={20} />
                          </motion.div>
                        ) : (
                          <>
                            Roll Once <span className="opacity-40">|</span> {banner.cost} Carrots
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div 
              animate={{ 
                rotate: [0, -2, 2, -2, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative mb-12"
            >
              <div className="absolute inset-0 bg-blue-500 blur-[120px] opacity-40 animate-pulse" />
              <div className="relative w-80 h-80 rounded-[48px] bg-zinc-900 border-4 border-white/20 p-12 flex items-center justify-center shadow-2xl">
                <img src={result.image} alt={result.name} className="w-full h-full object-contain" />
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-zinc-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl whitespace-nowrap"
              >
                {result.rarity} ACQUIRED!
              </motion.div>
            </motion.div>

            <h3 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tight">{result.name}</h3>
            <p className="text-zinc-500 font-bold mb-12 uppercase tracking-widest">{result.category}</p>

            <button 
              onClick={() => setResult(null)}
              className="px-12 py-5 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95"
            >
              Confirm
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isRolling && !result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-8">
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1],
                filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-32 h-32 rounded-full border-b-4 border-t-4 border-blue-500 flex items-center justify-center"
            >
              <Sparkles className="text-white" size={48} />
            </motion.div>
            <span className="text-white font-black uppercase tracking-[0.5em] italic text-2xl animate-pulse">Summoning...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
