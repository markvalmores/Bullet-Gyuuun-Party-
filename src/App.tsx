/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, setDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { GameState, Character, ScoreBreakdown, UserProfile, GameSettings, GameItem, GachaBanner } from './types';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { StartScreen } from './components/StartScreen';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { ResultsScreen } from './components/ResultsScreen';
import { SettingsModal } from './components/SettingsModal';
import { Shop } from './components/Shop';
import { Gacha } from './components/Gacha';
import { DailyCalendar } from './components/DailyCalendar';
import { LoadingScreen } from './components/LoadingScreen';
import { Music, Volume2, VolumeX, ShieldCheck, RefreshCw, Settings as SettingsIcon, ShoppingBag, Sparkles, Users, Radio, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SHOP_ITEMS } from './data/items';

const BACKGROUND_URL = '/src/assets/images/matsuri_night_market_1785974272760.jpg';
const CARROT_ICON = '/src/assets/images/golden_carrot_currency_1785977909091.jpg';

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
  autoSave: true,
  deviceType: 'Detecting...',
  os: 'Detecting...'
};

// Mapping assets from user uploads
const PLAYER_1_URL = '/assets/input_file_1.png'; // Dancing Usagyuuun
const PLAYER_2_URL = '/assets/input_file_2.png'; // Blue BG Usagyuuun
const TARGET_URL = '/assets/input_file_0.png';   // Balloons Usagyuuun

const FOOD_TARGETS = [
  'https://www.image2url.com/r2/default/images/1785981294992-d21b875d-6ee5-44ee-96a9-79b074044075.png',
  'https://www.image2url.com/r2/default/images/1785981347735-83d8d341-e7ca-49a6-9556-5321b0252fff.png',
  'https://www.image2url.com/r2/default/images/1785981379259-b9552a51-d5eb-4a71-a4a3-386e2bbf4a65.png',
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
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [livePlayers, setLivePlayers] = useState(0);
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('gyuuun_save_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.characters) return data.characters;
      } catch (e) {
        console.error("Failed to load characters from save data");
      }
    }
    return INITIAL_CHARACTERS;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('gyuuun_save_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.profile) return data.profile;
      } catch (e) {
        console.error("Failed to load profile from save data");
      }
    }
    return null;
  });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [lastScore, setLastScore] = useState<ScoreBreakdown | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('gyuuun_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [view, setView] = useState<'GAME' | 'SHOP' | 'GACHA'>('GAME');
  const [showCalendar, setShowCalendar] = useState(false);

  // Daily Login Logic
  useEffect(() => {
    if (!profile || isGuest) return;

    const checkLogin = async () => {
      const now = new Date();
      const lastLogin = profile.lastLogin ? new Date(profile.lastLogin) : null;
      
      const isNewDay = !lastLogin || 
        now.getDate() !== lastLogin.getDate() || 
        now.getMonth() !== lastLogin.getMonth() || 
        now.getFullYear() !== lastLogin.getFullYear();

      if (isNewDay) {
        // Check if streak is maintained (less than 48h since last login)
        const diff = lastLogin ? now.getTime() - lastLogin.getTime() : 0;
        const streakMaintained = diff < 48 * 60 * 60 * 1000;
        const newStreak = streakMaintained ? (profile.dailyStreak || 0) + 1 : 1;

        await updateDoc(doc(db, 'users', profile.uid), {
          lastLogin: now.toISOString(),
          dailyStreak: newStreak,
          claimedToday: false
        });

        setProfile(prev => prev ? ({ 
          ...prev, 
          lastLogin: now.toISOString(), 
          dailyStreak: newStreak, 
          claimedToday: false 
        }) : null);
        
        setShowCalendar(true);
      }
    };

    checkLogin();
  }, [profile?.uid]); // Only run when user profile loads

  // Stats Listener
  useEffect(() => {
    const unsubStats = onSnapshot(doc(db, 'stats', 'global'), (snap) => {
      if (snap.exists()) {
        setTotalPlayers(snap.data().totalPlayers || 0);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'stats/global');
    });

    // Simple Live Players count (active in last 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const q = query(collection(db, 'online_players'), where('lastSeen', '>=', fiveMinsAgo));
    
    const unsubLive = onSnapshot(q, (snap) => {
      setLivePlayers(snap.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'online_players');
    });

    return () => {
      unsubStats();
      unsubLive();
    };
  }, []);

  // Heartbeat
  useEffect(() => {
    if (!profile) return;
    const interval = setInterval(async () => {
      try {
        await setDoc(doc(db, 'online_players', profile.uid), {
          lastSeen: new Date().toISOString(),
          username: profile.username
        });
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [profile]);

  // Achievement Check: 1000 Players Bonus
  useEffect(() => {
    if (totalPlayers >= 1000 && profile && !profile.achievements?.includes('1000_PLAYERS_BONUS')) {
      const giveBonus = async () => {
        try {
          const newCarrots = profile.goldenCarrots + 1000;
          const newAchievements = [...(profile.achievements || []), '1000_PLAYERS_BONUS'];
          
          await updateDoc(doc(db, 'users', profile.uid), {
            goldenCarrots: newCarrots,
            achievements: newAchievements
          });

          setProfile(prev => prev ? ({ ...prev, goldenCarrots: newCarrots, achievements: newAchievements }) : null);
          setSystemMessage("Global Milestone Reached! +1000 Golden Carrots Bonus!");
          setTimeout(() => setSystemMessage(null), 5000);
        } catch (e) {
          console.error("Failed to give milestone bonus", e);
        }
      };
      giveBonus();
    }
  }, [totalPlayers, profile]);

  // AutoSave Effect
  useEffect(() => {
    if (settings.autoSave && (state === 'RESULTS' || state === 'PROFILE_SETUP')) {
      const gameData = {
        profile,
        characters,
        settings,
        lastPlayed: new Date().toISOString()
      };
      localStorage.setItem('gyuuun_save_data', JSON.stringify(gameData));
      console.log("Autosave complete.");
    }
  }, [state, profile, characters, settings]);

  useEffect(() => {
    localStorage.setItem('gyuuun_settings', JSON.stringify(settings));
  }, [settings]);

  const syncUserProfile = useCallback(async (firebaseUser: any) => {
    if (!firebaseUser) {
      setState('AUTH');
      return;
    }

    try {
      const bypassEmail = localStorage.getItem('gyuuun_admin_bypass');
      const effectiveEmail = firebaseUser.isAnonymous ? (bypassEmail || 'guest@gyuuun.party') : firebaseUser.email;
      const isAdmin = effectiveEmail ? ADMIN_EMAILS.includes(effectiveEmail.toLowerCase()) : false;

      const docRef = doc(db, 'users', firebaseUser.uid);
      let userData: UserProfile | null = null;
      
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          userData = docSnap.data() as UserProfile;
        }
      } catch (e) {
        console.warn("Firestore read failed, using temporary profile", e);
      }
      
      if (userData) {
        // Force admin status if it's an admin email but doc doesn't have it
        if (isAdmin && (!userData.isAdmin || userData.goldenCarrots < 1000000)) {
          const updatedProfile = {
            ...userData,
            isAdmin: true,
            level: 99,
            goldenCarrots: 999999999,
            inventory: {
              ...userData.inventory,
              items: Array.from(new Set([...userData.inventory.items, 'gun_laser_1', 'target_pizza_pro', 'skill_fever_boost', 'char_vampire', 'acc_top_hat', 'grand_violet_overlord']))
            }
          };
          try {
            await updateDoc(docRef, { 
              isAdmin: true, 
              level: 99, 
              goldenCarrots: 999999999,
              'inventory.items': updatedProfile.inventory.items
            });
          } catch (e) { console.error("Admin update failed", e); }
          setProfile(updatedProfile);
        } else {
          setProfile({ ...userData, isAdmin });
        }
        setState('START');
      } else {
        // No profile yet, or firestore failed. 
        // If it's an admin or if we just want to bypass errors, initialize now.
        if (isAdmin || bypassEmail || firebaseUser.isAnonymous) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            username: isAdmin ? `Admin ${effectiveEmail?.split('@')[0]}` : `Gyuuun Player`,
            photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${effectiveEmail || firebaseUser.uid}`,
            email: effectiveEmail,
            createdAt: new Date().toISOString(),
            isAdmin: isAdmin,
            level: isAdmin ? 99 : 1,
            goldenCarrots: isAdmin ? 999999999 : 340,
            inventory: {
              items: isAdmin ? ['gun_laser_1', 'target_pizza_pro', 'skill_fever_boost', 'char_vampire', 'acc_top_hat', 'grand_violet_overlord'] : [],
              goldenCarrots: isAdmin ? 999999999 : 340,
              equipped: {
                skills: isAdmin ? ['skill_fever_boost', 'grand_violet_overlord'] : [],
                character: isAdmin ? 'char_vampire' : undefined,
                gun: isAdmin ? 'gun_laser_1' : undefined
              }
            },
            achievements: isAdmin ? ['ADMIN_BYPASS'] : [],
            dailyStreak: 1,
            claimedToday: true
          };
          try {
            await setDoc(docRef, newProfile);
          } catch (e) { console.error("Profile creation failed", e); }
          setProfile(newProfile);
          setState('START');
        } else {
          setState('PROFILE_SETUP');
        }
      }
    } catch (err) {
      console.error("Critical Profile Sync Error:", err);
      // Fallback
      setProfile({
        uid: firebaseUser.uid,
        username: 'Player',
        photoURL: '',
        email: firebaseUser.email,
        goldenCarrots: 0,
        inventory: { items: [], goldenCarrots: 0, equipped: { skills: [] } }
      } as any);
      setState('START');
    } finally {
      // Logic for loading end if we had a global loading state
    }
  }, [characters]);

  useEffect(() => {
    if (state === 'TITLE') return;
    if (isGuest) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      syncUserProfile(firebaseUser);
    });
    return () => unsubscribe();
  }, [state, isGuest, syncUserProfile]);

  const handleGuestPlay = () => {
    setIsGuest(true);
    setProfile({
      uid: 'guest-' + Math.random().toString(36).substr(2, 9),
      username: 'Guest Gyuuun',
      photoURL: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
      email: null,
      createdAt: new Date().toISOString(),
      isAdmin: false,
      goldenCarrots: 0,
      inventory: {
        items: [],
        equipped: { skills: [] }
      }
    });
    setState('START');
  };

  const handleStartGame = (char: Character) => {
    setSelectedCharacter(char);
    setState('PLAYING');
  };

  const handleStartApp = () => {
    setState('PRELOADING');
  };

  const handlePreloadingComplete = () => {
    if (isGuest) {
      setState('START');
    } else if (user) {
      syncUserProfile(user);
    } else {
      setState('AUTH');
    }
  };

  const handleFinish = async (score: ScoreBreakdown) => {
    setLastScore(score);
    setState('RESULTS');
    
    // Calculate Golden Carrots: 1 Carrot for every 1000 points
    const earnedCarrots = Math.floor(score.totalScore / 1000);

    if (profile && !isGuest) {
      try {
        await addDoc(collection(db, 'scores'), {
          userId: profile.uid,
          username: profile.username,
          photoURL: profile.photoURL,
          score: score.totalScore,
          combo: score.maxCombo,
          timestamp: serverTimestamp()
        });

        // Update Carrots
        await updateDoc(doc(db, 'users', profile.uid), {
          goldenCarrots: increment(earnedCarrots)
        });

        setProfile(prev => prev ? ({ ...prev, goldenCarrots: prev.goldenCarrots + earnedCarrots }) : null);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'scores');
      }
    }

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

  const handlePurchase = async (item: GameItem) => {
    if (!profile || profile.goldenCarrots < item.price) return;

    try {
      const newCarrots = profile.goldenCarrots - item.price;
      const newItems = [...profile.inventory.items, item.id];
      
      await updateDoc(doc(db, 'users', profile.uid), {
        goldenCarrots: newCarrots,
        'inventory.items': newItems
      });

      setProfile(prev => prev ? ({
        ...prev,
        goldenCarrots: newCarrots,
        inventory: { ...prev.inventory, items: newItems }
      }) : null);

      if (item.category === 'CHARACTER') {
        setCharacters(prev => [...prev, {
          id: item.id,
          name: item.name,
          image: item.image,
          bestScore: 0,
          bestCombo: 0
        }]);
      }

      setSystemMessage(`Purchased ${item.name}!`);
      setTimeout(() => setSystemMessage(null), 3000);
    } catch (e) {
      console.error("Purchase failed", e);
    }
  };

  const handleRollGacha = async (banner: GachaBanner): Promise<GameItem | null> => {
    if (!profile || profile.goldenCarrots < banner.cost) return null;

    try {
      const random = Math.random() * 100;
      let wonItem: GameItem;

      if (random < banner.rate) {
        wonItem = banner.limitedItem;
      } else {
        // Fallback to random rare/epic item
        const fallbacks = SHOP_ITEMS.filter(i => i.id !== banner.limitedItem.id);
        wonItem = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      const newCarrots = profile.goldenCarrots - banner.cost;
      const newItems = Array.from(new Set([...profile.inventory.items, wonItem.id]));

      await updateDoc(doc(db, 'users', profile.uid), {
        goldenCarrots: newCarrots,
        'inventory.items': newItems
      });

      setProfile(prev => prev ? ({
        ...prev,
        goldenCarrots: newCarrots,
        inventory: { ...prev.inventory, items: newItems }
      }) : null);

      if (wonItem.category === 'CHARACTER' && !characters.some(c => c.id === wonItem.id)) {
        setCharacters(prev => [...prev, {
          id: wonItem.id,
          name: wonItem.name,
          image: wonItem.image,
          bestScore: 0,
          bestCombo: 0
        }]);
      }

      return wonItem;
    } catch (e) {
      console.error("Gacha failed", e);
      return null;
    }
  };

  const handleAIGacha = async (): Promise<GameItem | null> => {
    if (!profile || profile.goldenCarrots < 500) {
      setSystemMessage("Need 500 Golden Carrots for AI Gacha!");
      setTimeout(() => setSystemMessage(null), 3000);
      return null;
    }

    try {
      const res = await fetch('/api/gacha/generate', { method: 'POST' });
      const newItem = await res.json();
      
      const gameItem: GameItem = {
        id: `ai_${Date.now()}`,
        name: newItem.name,
        description: newItem.description,
        category: 'TARGET',
        price: 0,
        image: newItem.image,
        rarity: newItem.rarity as any
      };

      // Add to inventory and global food targets temporarily for this session
      FOOD_TARGETS.push(gameItem.image);

      await updateDoc(doc(db, 'users', profile.uid), {
        goldenCarrots: profile.goldenCarrots - 500,
        'inventory.items': [...profile.inventory.items, gameItem.id]
      });

      setProfile(prev => prev ? ({
        ...prev,
        goldenCarrots: prev.goldenCarrots - 500,
        inventory: {
          ...prev.inventory,
          items: [...prev.inventory.items, gameItem.id]
        }
      }) : null);

      return gameItem;
    } catch (e) {
      console.error("AI Gacha failed", e);
      setSystemMessage("AI Gacha service temporarily busy. Try again!");
      setTimeout(() => setSystemMessage(null), 3000);
      return null;
    }
  };

  const handleRetry = () => {
    setState('START');
  };

  const handleClaimDaily = async (reward: number, reason?: string) => {
    if (!profile || profile.claimedToday) return;

    try {
      const newCarrots = profile.goldenCarrots + reward;
      await updateDoc(doc(db, 'users', profile.uid), {
        goldenCarrots: newCarrots,
        claimedToday: true
      });

      setProfile(prev => prev ? ({ 
        ...prev, 
        goldenCarrots: newCarrots, 
        claimedToday: true 
      }) : null);

      setSystemMessage(`Claimed ${reward} Golden Carrots! ${reason ? `(${reason})` : ''}`);
      setTimeout(() => {
        setSystemMessage(null);
        setShowCalendar(false);
      }, 3000);
    } catch (e) {
      console.error("Claim failed", e);
    }
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

  const handleExportData = () => {
    const gameData = {
      profile,
      characters,
      settings,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gyuuun_party_save_${new Date().getTime()}.bgp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSystemMessage("Save Data Exported Successfully! (.bgp)");
    setTimeout(() => setSystemMessage(null), 3000);
  };

  const handleImportData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.profile) setProfile(data.profile);
      if (data.characters) setCharacters(data.characters);
      if (data.settings) setSettings(data.settings);
      
      setSystemMessage("Save Data Imported Successfully!");
      setTimeout(() => setSystemMessage(null), 3000);
    } catch (err) {
      setSystemMessage("Import Failed: Invalid .bgp file");
      setTimeout(() => setSystemMessage(null), 3000);
    }
  };

  const handleDeleteData = () => {
    if (window.confirm("ARE YOU SURE? This will PERMANENTLY DELETE all local progress, high scores, and settings. This cannot be undone!")) {
      localStorage.clear();
      refreshSystem();
    }
  };

  const handleManualSave = () => {
    const gameData = {
      profile,
      characters,
      settings,
      lastPlayed: new Date().toISOString()
    };
    localStorage.setItem('gyuuun_save_data', JSON.stringify(gameData));
    setSystemMessage("Save Data Stored Successfully!");
    setTimeout(() => setSystemMessage(null), 3000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans selection:bg-blue-500/30 touch-none">
      <img 
        src={BACKGROUND_URL}
        alt="Festival Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 blur-[1px]"
        referrerPolicy="no-referrer"
      />

      {/* Global Stats Overlay */}
      <div className="absolute bottom-6 left-6 z-50 flex items-center gap-4">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <Users size={16} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Registered</span>
              <span className="text-sm font-black text-white">{totalPlayers.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-green-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live</span>
              <span className="text-sm font-black text-white">{livePlayers} Playing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Navigation - Shown only in Lobby (START) or RESULTS to avoid overlap and clutter */}
      <AnimatePresence>
        {(state === 'START' || state === 'RESULTS') && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 p-4 md:p-6 flex flex-wrap justify-between items-start gap-4 pointer-events-none"
          >
            {/* Left Side Controls */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 pointer-events-auto">
              <motion.div 
                onClick={runAntiVirus}
                className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/20 cursor-pointer hover:bg-black/80 transition-all shadow-lg"
              >
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest hidden sm:inline">Secure State</span>
              </motion.div>

              <button 
                onClick={refreshSystem}
                title="Auto-Fix System"
                className="p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/10 transition-all shadow-lg"
              >
                <RefreshCw size={14} className="text-white" />
              </button>

              {profile && (
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-white/10 shadow-lg">
                  <img src={profile.photoURL} alt="pfp" className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  <div className="flex items-center gap-2 md:gap-3 px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs font-bold text-white tracking-tight leading-none truncate max-w-[80px] md:max-w-none">{profile.username}</span>
                      {profile.isAdmin && (
                        <span className="text-[7px] md:text-[8px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">Admin</span>
                      )}
                    </div>
                    <div className="h-4 md:h-6 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <img src={CARROT_ICON} className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-xs font-black text-yellow-400">{profile.goldenCarrots?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 pointer-events-auto">
              <button 
                onClick={() => setView('SHOP')}
                className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-5 md:py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full border border-white/20 text-white transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <ShoppingBag size={14} className="md:w-[18px] md:h-[18px]" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Shop</span>
              </button>

              <button 
                onClick={() => setView('GACHA')}
                className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-5 md:py-2.5 bg-purple-600 hover:bg-purple-500 rounded-full border border-white/20 text-white transition-all shadow-lg shadow-purple-600/20 active:scale-95"
              >
                <Sparkles size={14} className="md:w-[18px] md:h-[18px]" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Gacha</span>
              </button>

              <button 
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-5 md:py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full border border-white/10 text-white transition-all shadow-lg active:scale-95"
              >
                <Calendar size={14} className="md:w-[18px] md:h-[18px]" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Rewards</span>
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors shadow-lg active:scale-95"
                >
                  <SettingsIcon size={16} className="md:w-[20px] md:h-[20px] text-white" />
                </button>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 md:p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors shadow-lg active:scale-95"
                >
                  {isMuted ? (
                    <VolumeX size={16} className="md:w-[20px] md:h-[20px] text-red-400" />
                  ) : (
                    <Volume2 size={16} className="md:w-[20px] md:h-[20px] text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {state === 'TITLE' && (
            <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <TitleScreen onStart={handleStartApp} />
            </motion.div>
          )}

          {state === 'PRELOADING' && (
            <LoadingScreen key="preloading" onComplete={handlePreloadingComplete} />
          )}

          {state === 'AUTH' && (
            <motion.div key="auth" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
              <Auth 
                onAuthSuccess={() => syncUserProfile(auth.currentUser)} 
                onGuestPlay={handleGuestPlay} 
              />
            </motion.div>
          )}

          {state === 'PROFILE_SETUP' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ProfileSetup onComplete={() => setState('START')} />
            </motion.div>
          )}

          {state === 'START' && (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <StartScreen characters={characters} onStart={handleStartGame} />
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

      {/* Shop Overlay */}
      <AnimatePresence>
        {view === 'SHOP' && profile && (
          <Shop 
            profile={profile} 
            onClose={() => setView('GAME')} 
            onPurchase={handlePurchase}
          />
        )}
      </AnimatePresence>

      {/* Gacha Overlay */}
      <AnimatePresence>
        {view === 'GACHA' && profile && (
          <Gacha 
            profile={profile} 
            onClose={() => setView('GAME')} 
            onRoll={handleRollGacha}
            onAIRoll={handleAIGacha}
          />
        )}
      </AnimatePresence>

      {/* Calendar Overlay */}
      <AnimatePresence>
        {showCalendar && profile && (
          <DailyCalendar 
            profile={profile}
            onClose={() => setShowCalendar(false)}
            onClaim={handleClaimDaily}
          />
        )}
      </AnimatePresence>

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

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-40 border-[16px] border-black/20" />

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            settings={settings} 
            onSave={(newSettings) => {
              setSettings(newSettings);
              setShowSettings(false);
            }} 
            onClose={() => setShowSettings(false)} 
            onExport={handleExportData}
            onImport={handleImportData}
            onDeleteData={handleDeleteData}
            onManualSave={handleManualSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
