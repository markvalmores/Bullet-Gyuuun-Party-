/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Target, MousePointer2 } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <img 
        src="https://kommodo.ai/i/KqV6vCmNJEQdyl1f2606" 
        alt="Bullet Gyuuuun Party!!!" 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Animated Target to Start */}
          <div className="relative group cursor-pointer" onClick={onStart}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative w-56 h-56 rounded-full bg-red-600/30 border-8 border-red-600 flex items-center justify-center group-hover:bg-red-600/50 transition-all shadow-[0_0_60px_rgba(220,38,38,0.6)]"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                 <Target size={140} className="text-red-600 opacity-20" strokeWidth={1} />
              </div>
              <div className="z-10 flex flex-col items-center">
                <span className="text-4xl font-black italic uppercase leading-tight text-white drop-shadow-md">Shoot</span>
                <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/90">The Gyuuun</span>
              </div>
              
              {/* Reticle Pulse */}
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-[-30px] border-4 border-red-500/50 rounded-full"
              />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white text-sm font-black uppercase tracking-[0.3em] whitespace-nowrap drop-shadow-lg"
            >
              <div className="flex items-center gap-2">
                <MousePointer2 size={16} />
                Click To Start
              </div>
              <div className="text-[10px] text-white/60 tracking-[0.5em] mt-1 text-center">
                Made by Usagyuun VTuber and Eleventh Gyuuun and Junichi555
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
