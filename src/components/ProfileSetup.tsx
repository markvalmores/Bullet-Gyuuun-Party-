/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { Camera, CheckCircle2, User } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const isAdmin = ['mdv4244@gmail.com', 'zerozone757@gmail.com', 'usagyuuunquan@gmail.com'].includes(auth.currentUser.email?.toLowerCase() || '');
      
      // 1. Initialize user doc
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        username: isAdmin ? `${username} (Admin)` : username,
        photoURL: photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        email: auth.currentUser.email,
        isAdmin: isAdmin,
        level: isAdmin ? 99 : 1,
        goldenCarrots: isAdmin ? 999999999 : 500, // Unlimited for admin
        inventory: {
          items: isAdmin ? ['gun_laser_1', 'target_pizza_pro', 'skill_fever_boost', 'char_vampire', 'acc_top_hat', 'grand_violet_overlord'] : [],
          equipped: {
            skills: isAdmin ? ['skill_fever_boost', 'grand_violet_overlord'] : [],
            character: isAdmin ? 'char_vampire' : undefined,
            gun: isAdmin ? 'gun_laser_1' : undefined
          }
        },
        achievements: [],
        createdAt: new Date().toISOString()
      });

      // 2. Increment global total players
      try {
        await updateDoc(doc(db, 'stats', 'global'), {
          totalPlayers: increment(1)
        });
      } catch (statsErr) {
        // If stats doc doesn't exist, create it
        await setDoc(doc(db, 'stats', 'global'), { totalPlayers: 1 }, { merge: true });
      }

      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md p-8 bg-black/80 backdrop-blur-xl border-2 border-white/10 rounded-[2.5rem] shadow-2xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Initialize Profile</h1>
        <p className="text-gray-400 text-sm mt-2 font-medium tracking-widest uppercase">Required for Leaderboard Entry</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 group bg-zinc-800 flex items-center justify-center">
            {photoURL ? (
              <img src={photoURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={48} className="text-zinc-600" />
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="text-white" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Display Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition-all"
            placeholder="CoolGyuuun88"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Profile Image URL (GIF/PNG/JPG)</label>
          <input
            type="text"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition-all"
            placeholder="https://example.com/avatar.gif"
          />
          <p className="text-[10px] text-gray-500 mt-2 px-1">Leave empty for a random generated avatar.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !username}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={20} />
              Confirm Identity
            </>
          )}
        </button>
      </form>
    </div>
  );
};
