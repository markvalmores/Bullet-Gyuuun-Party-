/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star, Target } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  username: string;
  photoURL: string;
  score: number;
  combo: number;
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardEntry[];
      setEntries(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full bg-black/40 backdrop-blur-md p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <Trophy className="text-yellow-400" size={32} />
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Global Rankings</h2>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${
                idx === 0 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="w-10 text-center text-xl font-black italic text-gray-500">
                #{idx + 1}
              </div>
              
              <img 
                src={entry.photoURL} 
                alt={entry.username} 
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />

              <div className="flex-1">
                <div className="text-white font-bold tracking-tight">{entry.username}</div>
                <div className="flex gap-4 mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-purple-400 font-black uppercase">
                    <Star size={10} />
                    {entry.combo} Combo
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {!loading && entries.length === 0 && (
          <div className="text-center py-12 text-gray-500 uppercase font-bold tracking-widest">No Records Yet</div>
        )}
      </div>
    </div>
  );
};
