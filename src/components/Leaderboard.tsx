/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star, Target, Crown, Zap, User, Flame } from 'lucide-react';
import { playSound } from '../lib/sound';

interface LeaderboardEntry {
  id: string;
  username: string;
  photoURL: string;
  bannerURL?: string;
  score: number;
  combo: number;
  timestamp?: any;
}

type TabCategory = 'TOP_10' | 'TOP_50' | 'TOP_100';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabCategory>('TOP_10');

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(100)
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

  const handleTabChange = (newTab: TabCategory) => {
    playSound('tab');
    setTab(newTab);
  };

  const getFilteredEntries = () => {
    switch (tab) {
      case 'TOP_10':
        return { items: entries.slice(0, 10), startRank: 1 };
      case 'TOP_50':
        return { items: entries.slice(10, 50), startRank: 11 };
      case 'TOP_100':
        return { items: entries.slice(50, 100), startRank: 51 };
      default:
        return { items: entries.slice(0, 10), startRank: 1 };
    }
  };

  const { items: visibleEntries, startRank } = getFilteredEntries();

  return (
    <div className="w-full h-full bg-zinc-950/80 backdrop-blur-2xl p-4 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 shadow-lg shadow-yellow-500/10">
            <Trophy className="text-yellow-400" size={32} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
              Hall of Fame
            </h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-1.5">
              Gyuuun Rhythm Legends Hall ({entries.length} Total Registered Scores)
            </p>
          </div>
        </div>

        {/* Tab Selection: Top 1-10, Top 11-50, Top 51-100 */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabChange('TOP_10')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
              tab === 'TOP_10'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-102'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown size={14} />
            <span>Top 1 - 10</span>
          </button>

          <button
            onClick={() => handleTabChange('TOP_50')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
              tab === 'TOP_50'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-102'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame size={14} />
            <span>Top 11 - 50</span>
          </button>

          <button
            onClick={() => handleTabChange('TOP_100')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
              tab === 'TOP_100'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-102'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star size={14} />
            <span>Top 51 - 100</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(250,204,21,0.3)]" />
            <span className="text-zinc-500 font-black uppercase tracking-widest text-xs">Summoning Legends...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 rounded-[2rem] border border-red-500/20">
            <Zap className="text-red-500 mb-4" size={40} />
            <p className="text-red-400 font-black uppercase tracking-widest text-sm">{error}</p>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-[2rem] border border-white/5">
            <Target className="text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">No Contenders in this Bracket Yet</p>
            <p className="text-zinc-600 text-xs mt-2 italic">Play more matches to populate rankings!</p>
          </div>
        ) : (
          visibleEntries.map((entry, idx) => {
            const actualRank = startRank + idx;
            const isFirst = actualRank === 1;
            const isSecond = actualRank === 2;
            const isThird = actualRank === 3;

            return (
              <motion.div
                key={entry.id || actualRank}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4), type: "spring", damping: 20 }}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isFirst
                    ? 'bg-gradient-to-r from-yellow-400/20 via-yellow-500/10 to-transparent border-yellow-400/40 shadow-xl shadow-yellow-900/10'
                    : isSecond
                    ? 'bg-gradient-to-r from-zinc-300/15 via-zinc-400/5 to-transparent border-zinc-400/30'
                    : isThird
                    ? 'bg-gradient-to-r from-amber-700/15 via-amber-800/5 to-transparent border-amber-800/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {/* Optional Banner Image Backdrop */}
                {entry.bannerURL && (
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center transition-all group-hover:opacity-25" style={{ backgroundImage: `url(${entry.bannerURL})` }} />
                )}

                {/* Rank Badge */}
                <div className="relative z-10 flex flex-col items-center justify-center w-12 shrink-0">
                  {isFirst ? (
                    <Crown className="text-yellow-400 mb-0.5" size={22} />
                  ) : isSecond ? (
                    <Medal className="text-zinc-300 mb-0.5" size={18} />
                  ) : isThird ? (
                    <Medal className="text-amber-600 mb-0.5" size={18} />
                  ) : null}
                  <span className={`text-xl font-black italic tracking-tighter ${
                    isFirst ? 'text-yellow-400' : isSecond ? 'text-zinc-300' : isThird ? 'text-amber-600' : 'text-zinc-500'
                  }`}>
                    #{actualRank}
                  </span>
                </div>

                {/* Avatar */}
                <div className="relative z-10">
                  <img
                    src={entry.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${entry.username}`}
                    alt={entry.username}
                    className={`w-12 h-12 rounded-xl object-cover border shadow-md ${
                      isFirst ? 'border-yellow-400' : 'border-white/20'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {isFirst && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border border-zinc-950 flex items-center justify-center">
                      <Star size={8} fill="black" className="text-black" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-black text-base truncate uppercase tracking-tight">{entry.username}</h3>
                    {actualRank <= 3 && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        isFirst ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/80'
                      }`}>
                        TOP {actualRank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      <Zap size={10} className="text-purple-400" />
                      <span>{entry.combo?.toLocaleString() || 0} Combo</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="relative z-10 text-right">
                  <div className={`text-2xl font-black italic tracking-tighter leading-none ${
                    isFirst ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-white'
                  }`}>
                    {entry.score?.toLocaleString() || 0}
                  </div>
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Points</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
