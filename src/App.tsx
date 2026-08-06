/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { GameState, Character, ScoreBreakdown, UserProfile, GameSettings } from './types';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { StartScreen } from './components/StartScreen';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { ResultsScreen } from './components/ResultsScreen';
import { SettingsModal } from './components/SettingsModal';
import { Music, Volume2, VolumeX, ShieldCheck, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BACKGROUND_URL = '/src/assets/images/matsuri_night_market_1785974272760.jpg';

const ADMIN_EMAILS = [
  'mdv4244@gmail.com',
  'usagyuuunquan@gmail.com',
  'zerozone757@gmail.com'
];

const DEFAULT_SETTINGS: GameSettings = {
  sensitivity: 1.0,
  offset: 0,
  speed: 1.0,
  autoFever: true,
  deviceType: 'Detecting...',
  os: 'Detecting...'
};

// Mapping assets from user uploads
const PLAYER_1_URL = '/assets/input_file_1.png'; // Dancing Usagyuuun
const PLAYER_2_URL = '/assets/input_file_2.png'; // Blue BG Usagyuuun
const TARGET_URL = '/assets/input_file_0.png';   // Balloons Usagyuuun

const FOOD_TARGETS = [
  '/src/assets/images/game_target_carrot_1785976682236.jpg',
  '/src/assets/images/game_target_mocchi_1785976693628.jpg',
  '/src/assets/images/game_target_apple_1785976705852.jpg',
  '/src/assets/images/game_target_sushi_1785976716931.jpg',
  '/src/assets/images/game_target_pizza_1785976727447.jpg',
  '/src/assets/images/game_target_ramen_1785976738966.jpg',
  TARGET_URL
];

const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'char1',
    name: 'Party Gyuuun',
    image: PLAYER_1_URL,
    bestScore: 0,
    bestCombo: 0
  },
  {
    id: 'char2',
    name: 'Cool Gyuuun',
    image: PLAYER_2_URL,
    bestScore: 0,
    bestCombo: 0
  }
];

export default function App() {
  const [state, setState] = useState<GameState>('TITLE');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [lastScore, setLastScore] = useState<ScoreBreakdown | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('gyuuun_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('gyuuun_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Only set up auth listener if we've moved past title
    if (state === 'TITLE') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          const isAdmin = firebaseUser.email ? ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase()) : false;
          setProfile({ ...userData, isAdmin });
          setState('START');
        } else {
          setState('PROFILE_SETUP');
        }
      } else {
        setState('AUTH');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleStart = (char: Character) => {
    setSelectedCharacter(char);
    setState('PLAYING');
  };

  const handleFinish = async (score: ScoreBreakdown) => {
    setLastScore(score);
    setState('RESULTS');
    
    // Persist score to Firestore
    if (profile) {
      try {
        await addDoc(collection(db, 'scores'), {
          userId: profile.uid,
          username: profile.username,
          photoURL: profile.photoURL,
          score: score.totalScore,
          combo: score.maxCombo,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.error("Score submission failed:", err);
      }
    }

    // Update local high scores
    if (selectedCharacter) {
      setCharacters(prev => prev.map(c => {
        if (c.id === selectedCharacter.id) {
          return {
            ...c,
            bestScore: Math.max(c.bestScore, score.totalScore),
            bestCombo: Math.max(c.bestCombo, score.maxCombo)
          };
        }
        return c;
      }));
    }
  };

  const handleRetry = () => {
    setState('START');
  };

  const runAntiVirus = () => {
    setSystemMessage("Anti-Virus Scan in Progress...");
    setTimeout(() => {
      setSystemMessage("System Purged. 0 Viruses Found. Enjoy the Party!");
      setTimeout(() => setSystemMessage(null), 3000);
    }, 1500);
  };

  const refreshSystem = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans selection:bg-blue-500/30 touch-none">
      {/* Global Background */}
      <img 
        src={BACKGROUND_URL}
        alt="Festival Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 blur-[1px]"
        referrerPolicy="no-referrer"
      />

      {/* Global Status Bar (Top Left) */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <motion.div 
          onClick={runAntiVirus}
          className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 cursor-pointer hover:bg-black/80 transition-all"
        >
          <ShieldCheck size={16} className="text-green-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure State</span>
        </motion.div>

        <button 
          onClick={refreshSystem}
          title="Auto-Fix System"
          className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={16} className="text-white" />
        </button>

        {profile && (
           <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
             <img src={profile.photoURL} alt="pfp" className="w-6 h-6 rounded-full border border-white/20" referrerPolicy="no-referrer" />
             <div className="flex flex-col">
               <span className="text-xs font-bold text-white tracking-tight leading-none">{profile.username}</span>
               {profile.isAdmin && (
                 <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">Admin Level 99</span>
               )}
             </div>
           </div>
        )}
      </div>

      {/* Global Audio Controls (Top Right) */}
      <div className="absolute top-6 right-6 flex gap-3 z-50">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        >
          <SettingsIcon size={20} className="text-white" />
        </button>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
        >
          {isMuted ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-white" />}
        </button>
        <div className="hidden md:flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">
          <Music size={16} className="text-blue-400 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Bullet Gyuuun Party - 128 BPM</span>
        </div>
      </div>

      {/* Main View Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === 'TITLE' && (
            <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <TitleScreen onStart={() => setState('AUTH')} />
            </motion.div>
          )}

          {state === 'AUTH' && (
            <motion.div key="auth" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
              <Auth onAuthSuccess={() => {}} />
            </motion.div>
          )}

          {state === 'PROFILE_SETUP' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ProfileSetup onComplete={() => setState('START')} />
            </motion.div>
          )}

          {state === 'START' && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <StartScreen characters={characters} onStart={handleStart} />
            </motion.div>
          )}

          {state === 'PLAYING' && selectedCharacter && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <GameCanvas 
                character={selectedCharacter} 
                onFinish={handleFinish} 
                targetImages={FOOD_TARGETS}
                settings={settings}
              />
            </motion.div>
          )}

          {state === 'RESULTS' && lastScore && selectedCharacter && (
            <motion.div key="results" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full h-full">
              <ResultsScreen 
                score={lastScore} 
                character={selectedCharacter} 
                onRetry={handleRetry} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* System Messaging */}
      <AnimatePresence>
        {systemMessage && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-blue-600 text-white font-black uppercase italic rounded-2xl shadow-2xl shadow-blue-500/50 border-2 border-white/20"
          >
            {systemMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-40 border-[16px] border-black/20" />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            settings={settings} 
            onSave={(newSettings) => {
              setSettings(newSettings);
              setShowSettings(false);
            }} 
            onClose={() => setShowSettings(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
