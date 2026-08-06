import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ScoreBreakdown, Character, FeverType, GameSettings } from '../types';
import { Zap, Loader2, Bomb, Star, Target as TargetIcon, Crosshair } from 'lucide-react';

const BPM = 128;
const BEAT_MS = (60 / BPM) * 1000;
const GAME_DURATION = 60000; // 60 seconds
const LANES = [0, 1, 2, 3];

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

interface Note {
  id: string;
  lane: number;
  y: number; // 0 to 100 (percentage)
  type: 'NORMAL' | 'GOLD' | 'BOMB';
  image: string;
  status: 'ACTIVE' | 'HIT' | 'MISS';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ character, onFinish, targetImages, settings }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [goods, setGoods] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000);
  const [feedback, setFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [lastLaneHit, setLastLaneHit] = useState<number | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  // Fever State
  const [feverAmount, setFeverAmount] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [feverType, setFeverType] = useState<FeverType>('BLUE');

  const startTimeRef = useRef<number>(Date.now());
  const gameLoopRef = useRef<number>(0);
  const nextSpawnRef = useRef<number>(Date.now() + 1000);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSFX = (type: 'HIT' | 'PERFECT' | 'MISS' | 'FEVER') => {
    try {
      initAudio();
      const ctx = audioCtxRef.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'HIT') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'PERFECT') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'MISS') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'FEVER') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context might be blocked
    }
  };

  const spawnNote = useCallback(() => {
    const lane = Math.floor(Math.random() * 4);
    const randomImage = targetImages[Math.floor(Math.random() * targetImages.length)];
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      lane,
      y: -10, // Start above screen
      type: Math.random() > 0.9 ? 'GOLD' : (Math.random() > 0.95 ? 'BOMB' : 'NORMAL'),
      image: randomImage,
      status: 'ACTIVE'
    };
    setNotes(prev => [...prev, newNote]);
  }, [targetImages]);

  const spawnParticles = useCallback((lane: number, y: number, isPerfect: boolean) => {
    const laneX = (lane * 25) + 12.5;
    const newParticles: Particle[] = [];
    const count = isPerfect ? 20 : 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 5 + (isPerfect ? 5 : 2);
      newParticles.push({
        id: Math.random().toString(),
        x: laneX, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        color: isPerfect ? 'bg-yellow-400' : 'bg-blue-400',
        scale: Math.random() * 0.4 + 0.4
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const handleLaneTap = (lane: number) => {
    setLastLaneHit(lane);
    setTimeout(() => setLastLaneHit(null), 100);
    
    // Find closest note in the lane
    const hitZoneY = 85;
    const hitThreshold = 15;
    
    setNotes(prev => {
      let hitFound = false;
      const newNotes = prev.map(note => {
        if (!hitFound && note.lane === lane && note.status === 'ACTIVE') {
          const dist = Math.abs(note.y - hitZoneY);
          if (dist < hitThreshold) {
            hitFound = true;
            let accuracy: 'PERFECT' | 'GOOD' | 'MISS' = 'MISS';
            if (dist < 4) accuracy = 'PERFECT';
            else if (dist < 10) accuracy = 'GOOD';
            
            if (accuracy !== 'MISS') {
              const feverMult = isFever ? 2 : 1;
              if (accuracy === 'PERFECT') {
                setPerfects(p => p + 1);
                setCombo(c => c + 1);
                setScore(s => s + (500 + combo * 10) * feverMult);
                setFeedback({ text: 'PERFECT!!', color: 'text-yellow-400', id: Date.now() });
                setFeverAmount(f => Math.min(100, f + 8));
                spawnParticles(lane, note.y, true);
                playSFX('PERFECT');
                setIsZooming(true);
                setTimeout(() => setIsZooming(false), 50);
              } else {
                setGoods(g => g + 1);
                setCombo(c => c + 1);
                setScore(s => s + (200 + combo * 5) * feverMult);
                setFeedback({ text: 'GOOD', color: 'text-blue-400', id: Date.now() });
                setFeverAmount(f => Math.min(100, f + 4));
                spawnParticles(lane, note.y, false);
                playSFX('HIT');
              }
              return { ...note, status: 'HIT' as const };
            }
          }
        }
        return note;
      });
      return newNotes;
    });
  };

  const triggerFever = useCallback(() => {
    if (feverAmount >= 100 && !isFever) {
      setIsFever(true);
      setFeverType('VIOLET');
      playSFX('FEVER');
      setTimeout(() => {
        setIsFever(false);
        setFeverAmount(0);
      }, 10000);
    }
  }, [feverAmount, isFever]);

  useEffect(() => {
    if (settings.autoFever) triggerFever();
  }, [feverAmount, settings.autoFever, triggerFever]);

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

      // Speed increases with time/combo
      const baseSpeed = 0.8;
      const timeBonus = (elapsed / GAME_DURATION) * 0.4;
      const speed = (baseSpeed + timeBonus + (combo * 0.001)) * settings.speed * (isFever ? 1.4 : 1.0);

      setNotes(prev => prev.map(n => {
        if (n.status === 'ACTIVE') {
          const newY = n.y + speed;
          if (newY > 105) {
            setMisses(m => m + 1);
            setCombo(0);
            setFeedback({ text: 'MISS', color: 'text-red-500', id: Date.now() });
            playSFX('MISS');
            return { ...n, status: 'MISS' as const, y: newY };
          }
          return { ...n, y: newY };
        }
        return n;
      }).filter(n => n.y < 110));

      // Spawn logic
      if (now >= nextSpawnRef.current) {
        spawnNote();
        const spawnInterval = isFever ? BEAT_MS / 1.5 : BEAT_MS;
        nextSpawnRef.current = now + (spawnInterval * (0.8 + Math.random() * 0.4));
      }

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * 0.1,
        y: p.y + p.vy * 0.1,
        life: p.life - 0.02
      })).filter(p => p.life > 0));

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [spawnNote, onFinish, perfects, goods, misses, maxCombo, score, combo, isFever, settings.speed]);

  return (
    <div className={`relative w-full h-full bg-zinc-950 overflow-hidden select-none transition-transform duration-75 ${isZooming ? 'scale-[1.02]' : 'scale-100'}`}>
      {/* Background Grid/Stars */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]" />
        <motion.div 
          animate={{ y: [0, 100] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Lanes Highway */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex z-10">
        {LANES.map(lane => (
          <div 
            key={lane}
            onClick={() => handleLaneTap(lane)}
            className={`relative flex-1 border-x border-white/5 transition-colors duration-200 cursor-pointer group active:bg-white/5 ${lastLaneHit === lane ? 'bg-white/10' : ''}`}
          >
            {/* Lane Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-blue-500/10 to-transparent`} />
            
            {/* Lane Line Decoration */}
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10" />
            
            {/* Bottom Hit Glow */}
            {lastLaneHit === lane && (
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-400/40 to-transparent z-10"
              />
            )}
          </div>
        ))}
      </div>

      {/* Timing Bar */}
      <div className="absolute bottom-[15%] inset-x-0 h-4 bg-white/5 backdrop-blur-sm border-y border-white/20 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
        {LANES.map(lane => (
          <div key={lane} className="absolute h-full w-[1px] bg-white/40" style={{ left: `${(lane * 25) + 12.5}%` }} />
        ))}
      </div>

      {/* Notes (Targets) */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <AnimatePresence>
          {notes.map(note => (
            note.status === 'ACTIVE' && (
              <motion.div
                key={note.id}
                className="absolute w-[20%] h-[12%] -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(note.lane * 25) + 12.5}%`, top: `${note.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0, filter: 'brightness(5) contrast(2)' }}
              >
                <div className={`relative w-full h-full flex items-center justify-center group`}>
                  {/* Outer Glow */}
                  <div className={`absolute inset-0 rounded-2xl blur-xl opacity-40 transition-colors ${isFever ? 'bg-red-500' : 'bg-blue-500'}`} />
                  
                  {/* Note Frame */}
                  <div className={`relative w-16 h-16 md:w-24 md:h-24 rounded-2xl border-4 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-2xl transition-colors ${
                    isFever ? 'border-red-400' : 'border-blue-400'
                  }`}>
                    <img 
                      src={note.image} 
                      alt="target" 
                      className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Inner Target Ring */}
                    <div className={`absolute inset-1 rounded-xl border border-dashed opacity-30 ${isFever ? 'border-red-400' : 'border-blue-400'}`} />
                  </div>

                  {/* Lane Guide Lines */}
                  <div className={`absolute -inset-x-4 h-1 top-1/2 -translate-y-1/2 opacity-20 ${isFever ? 'bg-red-400' : 'bg-blue-400'}`} />
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Particles Layer */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute ${p.color} rounded-full transition-opacity`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.scale * 12}px`,
              height: `${p.scale * 12}px`,
              opacity: p.life,
              transform: `translate(-50%, -50%)`
            }}
          />
        ))}
      </div>

      {/* Character / Gun Layer (Bottom) */}
      <div className="absolute bottom-0 inset-x-0 h-32 flex justify-center items-end z-50 pointer-events-none">
        <div className="relative w-48 h-48 mb-[-20px]">
          {/* Character */}
          <motion.img 
            src={character.image}
            alt="pfp"
            animate={{ 
              y: [0, -10, 0],
              rotate: lastLaneHit !== null ? [0, (lastLaneHit - 1.5) * 10, 0] : 0
            }}
            transition={{ duration: BEAT_MS / 1000, repeat: Infinity }}
            className={`w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] filter ${isFever ? 'brightness-125 saturate-150' : ''}`}
            referrerPolicy="no-referrer"
          />
          
          {/* Gun Flash */}
          <AnimatePresence>
            {lastLaneHit !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full"
              >
                <div className={`w-32 h-32 rounded-full blur-3xl ${isFever ? 'bg-red-400' : 'bg-blue-400'} opacity-60`} />
                <Crosshair size={48} className={`text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-glow`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fever Mode Overlay */}
      <AnimatePresence>
        {isFever && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-45"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent animate-pulse" />
            <div className="absolute inset-0 border-[10px] border-red-500/30 blur-md" />
            <motion.div 
              animate={{ x: [-100, 100] }}
              transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
              className="absolute top-1/2 left-0 right-0 h-1 bg-red-400 shadow-[0_0_20px_red]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD - Redesigned for Bullet Gyuuun Party */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-100 pointer-events-none gap-2 font-black italic">
        <div className="flex flex-col gap-4">
          {/* Score Box */}
          <div className="bg-black/90 backdrop-blur-xl px-6 py-2 rounded-2xl border-2 border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform -skew-x-12">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Score</div>
            <div className="text-3xl md:text-5xl text-white tracking-tighter drop-shadow-glow">
              {score.toLocaleString()}
            </div>
          </div>

          {/* Fever Bar */}
          <div className="w-48 md:w-64 h-6 bg-black/80 rounded-full border-2 border-white/10 overflow-hidden relative shadow-lg">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${feverAmount}%` }}
              className={`h-full bg-gradient-to-r ${isFever ? 'from-red-600 to-yellow-400' : 'from-blue-600 to-cyan-400'} transition-all`}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white uppercase tracking-widest mix-blend-difference">
              {isFever ? '!! FEVER ACTIVE !!' : 'Gyuuun Energy'}
            </div>
          </div>
        </div>

        {/* Center Timer/Combo */}
        <div className="flex flex-col items-center">
          <div className={`px-8 py-2 rounded-2xl border-2 border-white shadow-2xl transition-colors ${isFever ? 'bg-red-600' : 'bg-blue-600'}`}>
            <div className="text-2xl md:text-4xl text-white tracking-tighter">{timeLeft}s</div>
          </div>
          
          <AnimatePresence mode="wait">
            {combo >= 2 && (
              <motion.div
                key={combo}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="mt-4 flex flex-col items-center"
              >
                <div className={`text-6xl md:text-9xl tracking-tighter drop-shadow-glow ${isFever ? 'text-red-400' : 'text-yellow-400'}`}>
                  {combo}
                </div>
                <div className="text-xl md:text-2xl text-white uppercase tracking-widest mt-[-20px]">Combo</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Max Streak</div>
            <div className="text-2xl md:text-4xl text-white tracking-tighter">{maxCombo}</div>
          </div>
          
          <div className="flex gap-2 mt-2">
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-yellow-400 font-bold uppercase">Perf</div>
              <div className="text-lg text-white">{perfects}</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-blue-400 font-bold uppercase">Good</div>
              <div className="text-lg text-white">{goods}</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <div className="text-[10px] text-red-500 font-bold uppercase">Miss</div>
              <div className="text-lg text-white">{misses}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Judgment Feedback */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-100 pointer-events-none">
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.id}
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{ y: -50, opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0 }}
              className={`text-6xl md:text-8xl font-black italic ${feedback.color} drop-shadow-glow uppercase`}
            >
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Overlay (For mobile/help) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-100 flex gap-4 pointer-events-none opacity-40">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-12 h-12 rounded-xl border-2 border-white/20 flex items-center justify-center text-white/20 font-black">
            L{i}
          </div>
        ))}
      </div>
    </div>
  );
};
