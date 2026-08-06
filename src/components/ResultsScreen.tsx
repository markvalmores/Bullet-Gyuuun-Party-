/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ScoreBreakdown, Character } from '../types';
import { RefreshCcw, Trophy, Star, Target } from 'lucide-react';

interface ResultsScreenProps {
  score: ScoreBreakdown;
  character: Character;
  onRetry: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, character, onRetry }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/60 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-zinc-900 border-2 border-white/20 p-10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <Trophy className="text-yellow-400" size={48} />
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">Results</h1>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <StatRow icon={<Star size={20} className="text-yellow-400" />} label="Perfect" value={score.perfects} color="text-yellow-400" />
            <StatRow icon={<Star size={20} className="text-blue-400" />} label="Good" value={score.goods} color="text-blue-400" />
            <StatRow icon={<Target size={20} className="text-red-500" />} label="Miss" value={score.misses} color="text-red-500" />
            <StatRow icon={<RefreshCcw size={20} className="text-purple-400" />} label="Max Combo" value={score.maxCombo} color="text-purple-400" />
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 p-6">
            <div className="text-gray-400 uppercase text-sm font-bold mb-2 tracking-widest">Total Score</div>
            <div className="text-6xl font-black text-white tracking-tighter">
              {score.totalScore.toLocaleString()}
            </div>
            {score.totalScore > character.bestScore && (
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="mt-3 px-4 py-1 bg-yellow-500 text-black text-xs font-black rounded-full uppercase"
              >
                New Record!
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl mb-10">
          <h3 className="text-xs uppercase font-bold text-gray-500 mb-4 tracking-[0.2em]">Prizes Obtained</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-16 h-16 bg-zinc-800 rounded-xl border border-white/10 flex items-center justify-center">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${i}`} 
                  alt="Prize" 
                  className="w-10 h-10 opacity-50 grayscale"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="w-full py-5 bg-white text-black font-black text-2xl uppercase rounded-2xl flex items-center justify-center gap-3"
        >
          <RefreshCcw size={24} strokeWidth={3} />
          Play Again
        </motion.button>
      </motion.div>
    </div>
  );
};

const StatRow = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-gray-400 font-bold uppercase text-sm">{label}</span>
    </div>
    <span className={`text-2xl font-black ${color}`}>{value}</span>
  </div>
);
