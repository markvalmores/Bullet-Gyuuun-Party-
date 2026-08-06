import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Star, Ghost, Package, Zap } from 'lucide-react';
import { GachaBanner, GameItem, UserProfile } from '../types';
import { GACHA_BANNERS } from '../data/items';

interface GachaProps {
  profile: UserProfile;
  onClose: () => void;
  onRoll: (banner: GachaBanner) => Promise<GameItem | null>;
  onAIRoll: () => Promise<GameItem | null>;
}

export const Gacha: React.FC<GachaProps> = ({ profile, onClose, onRoll, onAIRoll }) => {
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

  const handleAIRoll = async () => {
    if (profile.goldenCarrots < 500) return;
    
    setIsRolling(true);
    setResult(null);
    
    const item = await onAIRoll();
    
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
                <div key={banner.id} className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-zinc-950 mb-8 last:mb-0 shadow-2xl">
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img src={banner.image} alt={banner.name} className="w-full h-[280px] object-cover opacity-50 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent p-12 flex flex-col justify-end">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.span 
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-red-600/40 italic"
                      >
                        Limited Event
                      </motion.span>
                    </div>
                    <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-6 leading-none drop-shadow-2xl">{banner.name}</h3>
                    
                    <div className="flex gap-6">
                      <button 
                        disabled={isRolling || profile.goldenCarrots < banner.cost}
                        onClick={() => handleRoll(banner)}
                        className="flex-1 py-5 bg-white text-black hover:bg-blue-400 hover:text-white disabled:bg-zinc-800 disabled:text-zinc-500 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group/btn"
                      >
                        <Sparkles size={20} className="group-hover/btn:animate-spin" />
                        Roll Once <span className="opacity-20">|</span> {banner.cost}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* AI Gacha Banner */}
              <div className="relative group rounded-[40px] overflow-hidden border border-fuchsia-500/40 bg-zinc-950 mt-8 shadow-[0_0_50px_rgba(192,38,211,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 animate-pulse" />
                <div className="w-full h-[280px] flex items-center justify-center relative">
                   <div className="absolute inset-0 flex items-center justify-center blur-3xl opacity-30">
                     <Zap size={120} className="text-fuchsia-500" />
                   </div>
                   <Zap size={80} className="text-fuchsia-400 drop-shadow-[0_0_20px_rgba(192,38,211,0.8)] animate-bounce relative z-10" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-12 flex flex-col justify-end">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-fuchsia-600/40 italic">GEN AI SPECIAL</span>
                  </div>
                  <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none drop-shadow-2xl">AI Dreams Gacha</h3>
                  <p className="text-zinc-300 font-bold mb-8 tracking-tight max-w-sm">Summon a unique, procedurally generated target sprite using the power of Gemini.</p>
                  
                  <div className="flex gap-6">
                    <button 
                      disabled={isRolling || profile.goldenCarrots < 500}
                      onClick={handleAIRoll}
                      className="flex-1 py-5 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-125 disabled:bg-zinc-800 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 rounded-2xl font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-fuchsia-600/40 transition-all flex items-center justify-center gap-4 active:scale-95 group/ai"
                    >
                      <Sparkles size={20} className="group-hover/ai:rotate-180 transition-transform duration-700" />
                      AI SUMMON <span className="opacity-40">|</span> 500
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="flex flex-col items-center z-10"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.02, 1]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative mb-12"
            >
              <div className="absolute inset-[-40px] bg-gradient-to-br from-blue-600 to-purple-600 blur-[100px] opacity-30 animate-pulse" />
              <div className="relative w-80 h-80 rounded-[64px] bg-white p-12 flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.2)]">
                <img src={result.image} alt={result.name} className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black border-2 border-white text-white px-10 py-4 rounded-full font-black uppercase tracking-[0.2em] text-lg shadow-2xl whitespace-nowrap italic"
              >
                {result.rarity}
              </motion.div>
            </motion.div>

            <h3 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter drop-shadow-2xl text-center">{result.name}</h3>
            <p className="text-zinc-500 font-bold mb-12 uppercase tracking-[0.4em] text-sm text-center">{result.category}</p>

            <button 
              onClick={() => setResult(null)}
              className="px-16 py-6 bg-white hover:bg-blue-500 hover:text-white text-black rounded-full font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              Accept Summon
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
