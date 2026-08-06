/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Camera, CheckCircle2, User, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';
import { playSound } from '../lib/sound';

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [loading, setLoading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File too large! Please choose an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoURL(event.target?.result as string);
        playSound('click');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Banner file too large! Please choose an image under 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerURL(event.target?.result as string);
        playSound('click');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    playSound('click');
    setLoading(true);
    try {
      const isAdmin = ['mdv4244@gmail.com', 'zerozone757@gmail.com', 'usagyuuunquan@gmail.com'].includes(auth.currentUser.email?.toLowerCase() || '');
      
      const userProfile = {
        uid: auth.currentUser.uid,
        username: isAdmin ? `${username} (Admin)` : username,
        photoURL: photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bannerURL: bannerURL || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
        email: auth.currentUser.email,
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
        achievements: [],
        createdAt: new Date().toISOString()
      };

      // 1. Save user document
      await setDoc(doc(db, 'users', auth.currentUser.uid), userProfile, { merge: true });

      // 2. Increment global total players counter
      try {
        await updateDoc(doc(db, 'stats', 'global'), {
          totalPlayers: increment(1)
        });
      } catch (statsErr) {
        await setDoc(doc(db, 'stats', 'global'), { totalPlayers: 1 }, { merge: true });
      }

      playSound('win');
      onComplete();
    } catch (err) {
      console.warn("Profile setup error handled:", err);
      // Fallback completion so login flow never blocks
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur-2xl border-2 border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
      
      {/* Banner Preview Header */}
      <div className="relative w-full h-32 rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 border border-white/10 mb-12 shadow-lg">
        {bannerURL ? (
          <img src={bannerURL} alt="Banner Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800/60">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <ImageIcon size={14} /> Cover Banner (GIF/JPG/PNG)
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-white/20"
        >
          <Upload size={14} />
          <span>Upload Banner</span>
        </button>

        {/* Avatar Overlay */}
        <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-950 shadow-2xl group flex items-center justify-center">
          {photoURL ? (
            <img src={photoURL} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={32} className="text-zinc-600" />
          )}

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera size={18} className="text-white" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerUpload}
        accept="image/gif,image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
          <span>Create Pilot Identity</span>
          <Sparkles className="text-purple-400" size={20} />
        </h1>
        <p className="text-zinc-400 text-xs mt-1 font-medium tracking-wider uppercase">
          Customize avatar & cover banner (GIF, PNG, JPG)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
            Display Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-bold"
            placeholder="e.g. MasterGyuuun99"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
            Profile Image URL or GIF
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
              placeholder="https://example.com/avatar.gif"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-1 transition-all"
            >
              <Upload size={14} />
              <span>File</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
            Cover Banner URL or GIF
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bannerURL}
              onChange={(e) => setBannerURL(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-all"
              placeholder="https://example.com/banner.gif"
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-1 transition-all"
            >
              <Upload size={14} />
              <span>File</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>Confirm & Start Game</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
