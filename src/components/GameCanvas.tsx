/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ScoreBreakdown, Character, FeverType, GameSettings } from '../types';
import { Target as TargetIcon, Zap, Loader2, Flame, Bomb } from 'lucide-react';

const BPM = 128;
const BEAT_MS = (60 / BPM) * 1000;
const GAME_DURATION = 60000; // 60 seconds

interface GameCanvasProps {
  character: Character;
  onFinish: (score: ScoreBreakdown) => void;
  targetImages: string[];
  settings: GameSettings;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  text?: string;
  color: string;
  scale: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ character, onFinish, targetImages, settings }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [goods, setGoods] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [feedback, setFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  // Fever State
  const [feverAmount, setFeverAmount] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [feverType, setFeverType] = useState<FeverType>('BLUE');

  const startTimeRef = useRef<number>(Date.now());
  const gameLoopRef = useRef<number>(0);
  const nextSpawnRef = useRef<number>(Date.now() + 1000);

  // Simple SFX Synthesizer
  const playSFX = (type: 'HIT' | 'PERFECT' | 'MISS' | 'FEVER') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'HIT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'PERFECT') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'MISS') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'FEVER') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio context might be blocked by browser policy
    }
  };

  // Gamepad State
  useEffect(() => {
    const handleGamepad = () => {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp) {
          // Check for button press (X, A, or Triggers)
          const pressed = gp.buttons.some(b => b.pressed);
          if (pressed) {
            // Logic to find closest target in range
            const now = Date.now() - startTimeRef.current;
            // Simplified hit detection for gamepad
            // In a real app we'd debounce or only trigger on 'down'
          }
        }
      }
    };
    const interval = setInterval(handleGamepad, 16);
    return () => clearInterval(interval);
  }, []);

  const spawnTarget = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const lane = Math.random() > 0.5 ? 0 : 1;
    const randomImage = targetImages[Math.floor(Math.random() * targetImages.length)];
    const newTarget: Target = {
      id: Math.random().toString(36).substr(2, 9),
      type: Math.random() > 0.8 ? 'MONSTER' : 'BUNNY',
      x: 110, // Start off-screen right
      y: lane === 0 ? 35 : 65,
      spawnTime: elapsed,
      status: 'ACTIVE',
      lane,
      image: randomImage
    };
    setTargets(prev => [...prev, newTarget]);
  }, [targetImages]);

  const spawnParticles = useCallback((x: number, y: number, isPerfect: boolean, isOmega: boolean) => {
    const newParticles: Particle[] = [];
    const count = isOmega ? 30 : (isPerfect ? 15 : 6);
    
    // Add text particle
    if (isOmega) {
      newParticles.push({
        id: Math.random().toString(),
        x, y, vx: 0, vy: -3, life: 1.5, 
        text: 'OMEGA!!', 
        color: 'text-purple-400',
        scale: 2.5
      });
    } else if (isPerfect) {
      newParticles.push({
        id: Math.random().toString(),
        x, y, vx: 0, vy: -2, life: 1, 
        text: 'GYUUUN!!', 
        color: 'text-yellow-400',
        scale: 1.5
      });
    }

    // Add spark particles
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 8 + (isOmega ? 10 : 2);
      newParticles.push({
        id: Math.random().toString(),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: isOmega ? 'bg-purple-500' : (isPerfect ? 'bg-yellow-400' : 'bg-blue-400'),
        scale: Math.random() * 0.5 + 0.5
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const handleHit = (targetId: string) => {
    const now = (Date.now() - startTimeRef.current) + settings.offset;
    
    setTargets(prev => prev.map(t => {
      if (t.id === targetId && t.status === 'ACTIVE') {
        const distanceToCenter = Math.abs(t.x - 20); 
        
        let accuracy: 'OMEGA' | 'PERFECT' | 'GOOD' | 'MISS' = 'MISS';
        if (distanceToCenter < 2) accuracy = 'OMEGA';
        else if (distanceToCenter < 6) accuracy = 'PERFECT';
        else if (distanceToCenter < 15) accuracy = 'GOOD';

        const feverMult = isFever ? (feverType === 'VIOLET' ? 5 : 2) : 1;

        if (accuracy === 'OMEGA') {
          setPerfects(p => p + 1);
          setCombo(c => c + 1);
          setScore(s => s + (500 + (combo * 50)) * feverMult);
          setFeedback({ text: 'OMEGA BULLSEYE', color: 'text-purple-400', id: Date.now() });
          setFeverAmount(prev => Math.min(100, prev + 15));
          spawnParticles(t.x, t.y, true, true);
          playSFX('FEVER');
          setIsZooming(true);
          setTimeout(() => setIsZooming(false), 150);
          return { ...t, status: 'HIT', hitTime: now };
        } else if (accuracy === 'PERFECT') {
          setPerfects(p => p + 1);
          setCombo(c => c + 1);
          setScore(s => s + (100 + (combo * 10)) * feverMult);
          setFeedback({ text: 'PERFECT', color: 'text-yellow-400', id: Date.now() });
          setFeverAmount(prev => Math.min(100, prev + 8));
          spawnParticles(t.x, t.y, true, false);
          playSFX('PERFECT');
          
          setIsZooming(true);
          setTimeout(() => setIsZooming(false), 100);

          return { ...t, status: 'HIT', hitTime: now };
        } else if (accuracy === 'GOOD') {
          setGoods(g => g + 1);
          setCombo(c => c + 1);
          setScore(s => s + (50 + (combo * 5)) * feverMult);
          setFeedback({ text: 'GOOD', color: 'text-blue-400', id: Date.now() });
          setFeverAmount(prev => Math.min(100, prev + 4));
          spawnParticles(t.x, t.y, false, false);
          playSFX('HIT');
          return { ...t, status: 'HIT', hitTime: now };
        } else {
          setMisses(m => m + 1);
          setCombo(0);
          setFeedback({ text: 'MISS', color: 'text-red-500', id: Date.now() });
          setFeverAmount(prev => Math.max(0, prev - 10));
          playSFX('MISS');
          return { ...t, status: 'MISS' };
        }
      }
      return t;
    }));
  };

  // Fever Trigger Logic
  const triggerFever = useCallback(() => {
    if (feverAmount >= 100 && !isFever) {
      setIsFever(true);
      const rand = Math.random();
      if (rand < 0.19) setFeverType('VIOLET');
      else if (rand < 0.6) setFeverType('RED');
      else setFeverType('BLUE');
      
      playSFX('FEVER');
      
      const timer = setTimeout(() => {
        setIsFever(false);
        setFeverAmount(0);
      }, 8000); 
      
      return () => clearTimeout(timer);
    }
  }, [feverAmount, isFever]);

  useEffect(() => {
    if (settings.autoFever) {
      triggerFever();
    }
  }, [feverAmount, isFever, settings.autoFever, triggerFever]);

  useEffect(() => {
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo, maxCombo]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (elapsed >= GAME_DURATION) {
        onFinish({ perfects, goods, misses, maxCombo, totalScore: score });
        return;
      }

      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION - elapsed) / 1000)));

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * 0.1,
        y: p.y + p.vy * 0.1,
        life: p.life - 0.02
      })).filter(p => p.life > 0));

      // Movement logic - speed scales slightly with combo
      const speedMult = (isFever ? 1.5 : 1.0) * settings.speed;
      const speed = (0.4 + (combo * 0.002)) * speedMult;
      setTargets(prev => prev.map(t => {
        if (t.status === 'ACTIVE') {
          const newX = t.x - speed;
          if (newX < -15) {
            setMisses(m => m + 1);
            setCombo(0);
            return { ...t, x: newX, status: 'MISS' as const };
          }
          return { ...t, x: newX };
        }
        return t;
      }).filter(t => t.x > -20));

      // Spawning logic (on the beat)
      if (now >= nextSpawnRef.current) {
        spawnTarget();
        const spawnInterval = isFever ? BEAT_MS / 2 : BEAT_MS;
        nextSpawnRef.current = now + spawnInterval / (Math.random() > 0.8 ? 2 : 1);
      }

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [spawnTarget, onFinish, perfects, goods, misses, maxCombo, score, combo, isFever]);

  const feverColors = {
    BLUE: 'from-blue-600 to-cyan-400 border-blue-400',
    RED: 'from-red-600 to-orange-400 border-red-400',
    VIOLET: 'from-purple-600 to-fuchsia-400 border-purple-400'
  };

  return (
    <div className={`relative w-full h-full overflow-hidden cursor-crosshair transition-all duration-100 ${isZooming ? 'scale-105' : 'scale-100'} ${isFever ? 'ring-[20px] ring-inset ring-white/10' : ''}`}>
      
      {/* Dynamic Background Pulse */}
      <motion.div 
        animate={{ opacity: [0, isFever ? 0.2 : 0.1, 0] }}
        transition={{ duration: 60/BPM, repeat: Infinity }}
        className={`absolute inset-0 pointer-events-none ${isFever ? (feverType === 'VIOLET' ? 'bg-purple-600' : 'bg-red-600') : 'bg-blue-500'}`}
      />

      {/* Fever Flames Overlay */}
      <AnimatePresence>
        {isFever && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden z-20"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -200], 
                  opacity: [0.6, 0],
                  scale: [1, 2],
                  rotate: [0, Math.random() * 360]
                }}
                transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: Math.random() }}
                className={`absolute bottom-0 w-24 h-24 blur-2xl rounded-full ${
                  feverType === 'BLUE' ? 'bg-blue-400' : feverType === 'RED' ? 'bg-red-500' : 'bg-purple-500'
                }`}
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Sprite (Bottom Left) */}
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] md:w-[30%] pointer-events-none z-30">
        <motion.img 
          src={character.image}
          alt="Player"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, isFever ? 4 : 2, 0]
          }}
          transition={{ duration: 60/BPM, repeat: Infinity, ease: "anticipate" }}
          className={`w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all ${isFever ? 'filter brightness-125 contrast-125' : ''}`}
          referrerPolicy="no-referrer"
        />
        
        {/* Muzzle Flash Effect */}
        <AnimatePresence>
          {isZooming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 2 }}
              exit={{ opacity: 0 }}
              className={`absolute top-1/4 right-0 w-48 h-48 rounded-full blur-3xl opacity-60 mix-blend-screen ${
                isFever ? (feverType === 'VIOLET' ? 'bg-purple-400' : 'bg-red-400') : 'bg-yellow-400'
              }`}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Rhythmic Reticle (The hit zone) */}
      <div className="absolute left-[20%] top-0 bottom-0 w-[8px] bg-white/5 border-x border-white/10 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 60/BPM, repeat: Infinity }}
          className={`absolute w-32 h-32 border-[6px] border-dashed rounded-full flex items-center justify-center ${isFever ? 'border-red-400' : 'border-blue-400'}`}
        >
          <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${isFever ? 'bg-red-400' : 'bg-blue-400'}`} />
        </motion.div>
        
        {/* Hit zone indicator */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500/20 rounded-full" />
        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500/20 rounded-full" />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute ${p.text ? p.color + ' font-black italic text-2xl uppercase' : p.color + ' rounded-full w-2 h-2'}`}
            style={{
              left: `${p.x}vw`,
              top: `${p.y}%`,
              opacity: p.life,
              transform: `scale(${p.scale * p.life})`
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Targets */}
      <div className="absolute inset-0 z-20">
        <AnimatePresence>
          {targets.map(t => (
            t.status === 'ACTIVE' && (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, scale: 0, x: '100vw' }}
                animate={{ opacity: 1, scale: 1, x: `${t.x}vw`, top: `${t.y}%` }}
                exit={{ opacity: 0, scale: 1.5, filter: 'brightness(3)' }}
                className="absolute w-28 h-28 -translate-y-1/2"
                style={{ left: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHit(t.id);
                }}
              >
                <div className="relative w-full h-full group">
                  <img 
                    src={t.image} 
                    alt="Target" 
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] group-hover:scale-125 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {/* Rhythm Hint Ring */}
                  <motion.div
                    animate={{ scale: [1.5, 0.8], opacity: [0.5, 0] }}
                    transition={{ duration: BEAT_MS/1000, repeat: Infinity }}
                    className={`absolute inset-0 border-2 rounded-full pointer-events-none ${isFever ? 'border-red-400' : 'border-white'}`}
                  />
                </div>
              </motion.button>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col gap-4">
          <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 shadow-2xl">
            <div className="text-[10px] text-gray-400 uppercase font-black mb-1 tracking-widest">Score</div>
            <div className="text-4xl font-black text-white italic tracking-tighter">{score.toLocaleString()}</div>
          </div>
          
          {/* Fever Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-64 h-6 bg-black/60 rounded-full border-2 border-white/10 overflow-hidden relative shadow-lg">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${feverAmount}%` }}
                className={`h-full bg-gradient-to-r transition-all duration-300 ${feverColors[feverType]}`}
              />
              {isFever && (
                <motion.div 
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">FEVER MODE ACTIVE!!</span>
                </motion.div>
              )}
            </div>
            
            {/* Manual Fever Button */}
            <AnimatePresence>
              {!settings.autoFever && feverAmount >= 100 && !isFever && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFever();
                  }}
                  className="pointer-events-auto w-full py-3 bg-red-600 rounded-xl border-2 border-white shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 group overflow-hidden relative"
                >
                  <motion.div 
                    animate={{ x: [-100, 200] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  />
                  <Bomb className="text-white group-hover:rotate-12 transition-transform" size={20} />
                  <span className="text-xs font-black text-white uppercase tracking-widest italic">Ignite Gyuuun Fever!</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className={`px-10 py-3 rounded-full border-4 border-white shadow-2xl transform -skew-x-12 transition-colors ${isFever ? 'bg-red-600' : 'bg-blue-600'}`}>
            <div className="text-3xl font-black text-white italic tracking-tighter">{timeLeft}s</div>
          </div>
          
          <AnimatePresence mode="wait">
            {combo >= 2 && (
              <motion.div
                key={combo}
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="mt-6 flex flex-col items-center"
              >
                <div className={`text-8xl font-black italic tracking-tighter drop-shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex items-center gap-3 ${isFever ? 'text-red-400' : 'text-yellow-400'}`}>
                  <Zap size={56} fill="currentColor" />
                  {combo} COMBO
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 text-right shadow-2xl">
            <div className="text-[10px] text-gray-400 uppercase font-black mb-1 tracking-widest">Max Combo</div>
            <div className="text-3xl font-black text-white italic tracking-tighter">{maxCombo}</div>
          </div>
           <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 self-end">
             <div className="flex items-center gap-2 text-[10px] text-blue-400 font-black uppercase">
               <Loader2 size={10} className="animate-spin" />
               Processing Gyuuun...
             </div>
          </div>
        </div>
      </div>

      {/* Timing Feedback */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.id}
              initial={{ y: 50, opacity: 0, scale: 0.5, rotate: -5 }}
              animate={{ y: -100, opacity: 1, scale: 1.5, rotate: 5 }}
              exit={{ opacity: 0 }}
              className={`text-7xl font-black italic ${feedback.color} drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] uppercase`}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls (Mobile Friendly) */}
      <div className="absolute bottom-8 right-8 z-50 pointer-events-none md:hidden">
         <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/20 flex items-center justify-center">
            <TargetIcon size={32} className="text-white opacity-40" />
         </div>
         <div className="mt-2 text-center text-[10px] text-white/40 font-bold uppercase tracking-widest">Tap Targets</div>
      </div>
    </div>
  );
};
