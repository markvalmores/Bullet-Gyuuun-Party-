/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import { Play, Trophy, X, Target, MousePointer2 } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { playSound } from '../lib/sound';

interface StartScreenProps {
  onStart: (char: Character) => void;
  characters: Character[];
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, characters }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSelection, setShowSelection] = useState(false);

  // Shoot to Start logic
  const handleShootStart = () => {
    playSound('fever');
    setShowSelection(true);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/40 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {!showSelection ? (
          <motion.div 
            key="title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center z-10"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="mb-8"
            >
              {/* Using provided image reference for mascot */}
              <img 
                src="https://ais-pre-2ph3ve6bahkh26ikbpgq4i-9199574104.asia-southeast1.run.app/assets/input_file_2.png" 
                alt="Usagyuuun Mascot" 
                className="w-48 md:w-64 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase text-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              Bullet Gyuuun Party!!!
            </h1>
            
            <div className="mt-12 relative group">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShootStart}
                className="relative w-48 h-48 rounded-full bg-red-600/20 border-8 border-red-600 flex items-center justify-center group-hover:bg-red-600/40 transition-all shadow-[0_0_40px_rgba(220,38,38,0.5)]"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                   <Target size={120} className="text-red-600 opacity-20" strokeWidth={1} />
                </div>
                <div className="z-10 flex flex-col items-center">
                  <span className="text-3xl font-black italic uppercase leading-tight">Shoot</span>
                  <span className="text-sm font-bold tracking-[0.2em] uppercase opacity-80">The Gyuuun</span>
                </div>
                
                {/* Reticle Pulse */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-[-20px] border-2 border-red-500/50 rounded-full"
                />
              </motion.button>
              
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                <MousePointer2 size={14} />
                Click/Tap Target To Start
              </div>
            </div>

            <button 
              onClick={() => setShowLeaderboard(true)}
              className="mt-20 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all font-bold uppercase tracking-widest text-sm"
            >
              <Trophy size={18} className="text-yellow-400" />
              Leaderboards
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 bg-black/80 p-8 rounded-[3rem] border-2 border-white/10 backdrop-blur-xl max-w-2xl w-full mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 px-2">
               <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                Select Your Warrior
              </h2>
              <button 
                onClick={() => setShowSelection(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-6 justify-center mb-10 overflow-x-auto py-4 px-2">
              {characters.map((char, idx) => (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative flex-shrink-0 group rounded-[2rem] overflow-hidden border-4 transition-all duration-300 ${
                    selectedIdx === idx ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <img 
                    src={char.image} 
                    alt={char.name} 
                    className="w-48 h-64 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-black">Best {char.bestScore}</div>
                    <div className="text-sm font-black uppercase text-white truncate">{char.name}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStart(characters[selectedIdx])}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 group"
            >
              <Play fill="currentColor" size={24} className="group-hover:translate-x-1 transition-transform" />
              Enter The Party
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowLeaderboard(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl h-full max-h-[80vh] bg-zinc-900 border-2 border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                 <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
                   <Trophy className="text-yellow-400" />
                   Hall of Gyuuun
                 </h2>
                 <button 
                  onClick={() => setShowLeaderboard(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Leaderboard />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
