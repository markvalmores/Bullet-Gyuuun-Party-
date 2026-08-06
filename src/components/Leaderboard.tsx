/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star, Target, Crown, Zap, User } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  username: string;
  photoURL: string;
  score: number;
  combo: number;
  timestamp?: any;
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaderboardEntry[];
        setEntries(docs);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Leaderboard error:", err);
        setError("Failed to load rankings. Please try again later.");
        setLoading(false);
      }
    }, (err) => {
      console.error("Snapshot error:", err);
      if (err.code === 'permission-denied') {
        setError("Missing permissions to view rankings.");
      } else {
        setError("Could not connect to the hall of fame.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full bg-zinc-950/50 p-4 md:p-10 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
            <Trophy className="text-yellow-400" size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Global Rankings</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">The Top 10 Gyuuun Legends</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <span className="text-zinc-500 font-black uppercase tracking-widest text-xs">Summoning Legends...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 rounded-[2rem] border border-red-500/20">
            <Zap className="text-red-500 mb-4" size={40} />
            <p className="text-red-400 font-black uppercase tracking-widest text-sm">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-[2rem] border border-white/5">
            <Target className="text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">The Arena is Empty</p>
            <p className="text-zinc-600 text-xs mt-2 italic">Be the first to claim your spot!</p>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, type: "spring", damping: 20 }}
              className={`group relative flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 ${
                idx === 0 
                  ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/10 border-yellow-400/40 shadow-xl shadow-yellow-900/10' 
                  : idx === 1
                  ? 'bg-gradient-to-r from-zinc-300/10 to-zinc-400/5 border-zinc-400/30'
                  : idx === 2
                  ? 'bg-gradient-to-r from-orange-700/10 to-orange-800/5 border-orange-800/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex flex-col items-center justify-center w-12 shrink-0">
                {idx === 0 ? (
                  <Crown className="text-yellow-400 mb-1" size={24} />
                ) : idx === 1 ? (
                  <Medal className="text-zinc-300 mb-1" size={20} />
                ) : idx === 2 ? (
                  <Medal className="text-orange-600 mb-1" size={20} />
                ) : null}
                <span className={`text-2xl font-black italic tracking-tighter ${
                  idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-600' : 'text-zinc-600'
                }`}>
                  #{idx + 1}
                </span>
              </div>
              
              {/* Avatar */}
              <div className="relative">
                <img 
                  src={entry.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.username}`} 
                  alt={entry.username} 
                  className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-lg ${
                    idx === 0 ? 'border-yellow-400' : 'border-white/10'
                  }`}
                  referrerPolicy="no-referrer"
                />
                {idx === 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                    <Star size={8} fill="black" className="text-black" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-lg truncate uppercase tracking-tight">{entry.username}</h3>
                  {idx < 3 && (
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      idx === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'
                    }`}>
                      Elite
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <Zap size={10} className="text-purple-400" />
                    <span className="text-zinc-400">{entry.combo.toLocaleString()}</span> Combo
                  </div>
                  <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <User size={10} className="text-blue-400" />
                    ID: {entry.id.slice(0, 4)}...
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`text-3xl font-black italic tracking-tighter leading-none ${
                  idx === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-white'
                }`}>
                  {entry.score.toLocaleString()}
                </div>
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Points</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
